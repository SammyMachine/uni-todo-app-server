const jsonServer = require('json-server');
const server = jsonServer.create();
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults();
server.use(jsonServer.bodyParser);

server.use((req, res, next) => {
  if (req.url.startsWith('/') && req.method === 'GET') {
    const toDbPath = `/db`;
    const data = router.db.getState();
    const transformedData = {
      list: data.list,
      revision: data.revision[0]
    };
    req.url = toDbPath;
    res.json(transformedData);
  } else {
    next();
  }
});

server.use((req, res, next) => {
  if (req.method === 'PUT') {
    const data = router.db.getState();
    const clientRevision = parseInt(req.get('revision'));
    const serverRevision = data.revision[0];
    data.revision[0] += 1;
    router.db.setState(data);
    next();
  } else {
    next();
  }
});

server.use((req, res, next) => {
  if (req.method === 'DELETE') {
    const data = router.db.getState();
    const clientRevision = parseInt(req.get('revision'));
    const serverRevision = data.revision[0];
    if (clientRevision === serverRevision) {
      data.revision[0] += 1;
      router.db.setState(data);
      next();
    } else {
      res.status(409).json({ message: 'Конфликт ревизии' });
    }
  } else {
    next();
  }
});

server.use((req, res, next) => {
  if (req.method === 'PATCH' && req.url === '/db') {
    const clientRevision = parseInt(req.get('revision'));
    const data = router.db.getState();
    const updatedList = req.body.list;
    data.list = updatedList;
    data.revision[0] = clientRevision;
    router.db.setState(data);
    router.db.write();
    res.jsonp({
      list: updatedList,
      revision: data.revision[0]
    });
  } else {
    next();
  }
});

server.use((req, res, next) => {
  if (req.method === 'POST') {
    const clientRevision = parseInt(req.get('revision'));
    const serverRevision = router.db.getState().revision[0];
    if (clientRevision === serverRevision) {
      const data = router.db.getState();
      data.revision[0] += 1;
      router.db.setState(data);
      next();
    } else {
      res.status(409).json({ message: 'Конфликт ревизии' });
      return;
    }
  } else {
    next();
  }
});

router.render = (req, res) => {
  if (req.method === 'PATCH') {
    res.jsonp({
      list: router.db.getState().list,
      revision: router.db.getState().revision[0]
    });
  } else if (req.method === 'PUT' || req.method === 'POST' || req.method === 'DELETE') {
    res.jsonp({
      element: res.locals.data,
      revision: router.db.getState().revision[0]
    });
  } else {
    res.jsonp({
      body: res.locals.data
    });
  }
};

server.use(middlewares);
server.use(router);

const port = 3000;
server.listen(port, () => {
  console.log(`JSON Server запущен на порту ${port}`);
});
