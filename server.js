const jsonServer = require('json-server');
const auth = require('json-server-auth');
const server = jsonServer.create();
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults();

server.db = router.db;

server.use(auth);

server.use(jsonServer.bodyParser);

server.use('/:userid/list', (req, res, next) => {
  // Проверяем, что метод запроса - GET
  if (req.method === 'GET') {
    const userid = parseInt(req.params.userid);
    const authHeader = req.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        message: 'Отсутствует токен авторизации'
      });
      return;
    }

    const token = authHeader.slice('Bearer '.length);

    // Ваша логика проверки токена и аутентификации пользователя
    // В данном примере просто добавляем токен к объекту пользователя
    // Помните, что в реальном приложении требуется более сложная логика аутентификации.

    const user = router.db.get('users').find({
      id: userid
    }).value();

    if (user) {
      res.jsonp({
        list: user.list,
        revision: user.revision[0]
      });
    } else {
      res.status(404).json({
        message: 'Пользователь не найден'
      });
    }
  } else {
    next();
  }
});




server.use('/:userid/list', (req, res, next) => {
  if (req.method === 'POST') {

    const userid = parseInt(req.params.userid);

    const authHeader = req.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        message: 'Отсутствует токен авторизации'
      });
      return;
    }

    const token = authHeader.slice('Bearer '.length);

    // Ваша логика проверки токена и аутентификации пользователя
    // В данном примере просто добавляем токен к объекту пользователя
    // Помните, что в реальном приложении требуется более сложная логика аутентификации.


    const newItem = req.body;
    const clientRevision = parseInt(req.get('revision'));

    const user = router.db.get('users').find({
      id: userid
    }).value();

    if (user) {
      if (clientRevision === user.revision[0]) {
        user.revision[0] += 1;
        user.list.push(newItem);
        router.db.write();

        res.jsonp({
          list: user.list,
          revision: user.revision[0]
        });
      } else {
        res.status(409).json({
          message: 'Конфликт ревизии'
        });
      }
    } else {
      res.status(404).json({
        message: 'Пользователь не найден'
      });
    }
  } else {
    next();
  }
});

server.use('/:userid/list/:id', (req, res, next) => {
  if (req.method === 'PUT') {
    const userid = parseInt(req.params.userid);

    const authHeader = req.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        message: 'Отсутствует токен авторизации'
      });
      return;
    }

    const token = authHeader.slice('Bearer '.length);

    const itemId = req.params.id;
    const updatedItem = req.body;
    const clientRevision = parseInt(req.get('revision'));
    const user = router.db.get('users').find({ id: userid }).value();

    if (user) {
      if (clientRevision === user.revision[0]) {
        user.revision[0] += 1;
        const existingItem = user.list.find(item => item.id === itemId);

        if (existingItem) {
          Object.assign(existingItem, updatedItem);
          router.db.write();
        
          res.jsonp({
            list: user.list,
            revision: user.revision[0]
          });
        } else {
          res.status(404).json({ message: 'Элемент не найден' });
        }
      } else {
        res.status(409).json({ message: 'Конфликт ревизии' });
      }
    } else {
      res.status(404).json({ message: 'Пользователь не найден' });
    }
  } else {
    next();
  }
});

server.use('/:userid/list/:id', (req, res, next) => {
  if (req.method === 'DELETE') {
    const userid = parseInt(req.params.userid);

    const authHeader = req.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        message: 'Отсутствует токен авторизации'
      });
      return;
    }

    const token = authHeader.slice('Bearer '.length);

    const itemId = req.params.id;
    const clientRevision = parseInt(req.get('revision'));
    const user = router.db.get('users').find({ id: userid }).value();

    if (user) {
      if (clientRevision === user.revision[0]) {
        const existingItemIndex = user.list.findIndex(item => item.id === itemId);

        if (existingItemIndex !== -1) {
          user.list.splice(existingItemIndex, 1);
          user.revision[0] += 1;
          router.db.write();

          res.jsonp({
            list: user.list,
            revision: user.revision[0]
          });
        } else {
          res.status(404).json({ message: 'Элемент не найден' });
        }
      } else {
        res.status(409).json({ message: 'Конфликт ревизии' });
      }
    } else {
      res.status(404).json({ message: 'Пользователь не найден' });
    }
  } else {
    next();
  }
});

server.use('/:userid/list', (req, res, next) => {
  if (req.method === 'PATCH') {
    const userid = parseInt(req.params.userid);

    const authHeader = req.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        message: 'Отсутствует токен авторизации'
      });
      return;
    }

    const token = authHeader.slice('Bearer '.length);
    
    const clientRevision = parseInt(req.get('revision'));
    const user = router.db.get('users').find({ id: userid }).value();

    if (user) {
      if (clientRevision === user.revision[0]) {

        const updatedList = req.body.list;
        user.list = updatedList;
        user.revision[0] += 1;
        router.db.write();

        res.jsonp({
          list: user.list,
          revision: user.revision[0]
        });
      } else {
        res.status(409).json({ message: 'Конфликт ревизии' });
      }
    } else {
      res.status(404).json({ message: 'Пользователь не найден' });
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