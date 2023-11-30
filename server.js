const jsonServer = require('json-server');
const auth = require('json-server-auth');
const server = jsonServer.create();
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults();
const routes = require('./routes.json');

module.exports = server;

server.db = router.db;

server.use(middlewares);
server.use(auth);
server.use(jsonServer.bodyParser);
//server.use(jsonServer.rewriter(routes));

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

    const newItem = req.body;
    const clientRevision = parseInt(req.get('revision'));

    const user1 = router.db.get('users').find({
      id: userid
    }).value();



        res.jsonp({
          user: user1
        });
    
  } else {
    next();
  }
});








server.use('/todos/:listid/:id', (req, res, next) => {
  if (req.method === 'PUT') {
    const listId = parseInt(req.params.listid);
    const itemId = req.params.id;
    const updatedItem = req.body;
    const clientRevision = parseInt(req.get('revision'));
    const todo = router.db.get('todos').find({ id: listId }).value();
    if (todo) {
      if (clientRevision === todo.revision[0]) {
        todo.revision[0] += 1;
        const existingItem = todo.list.find(item => item.id === itemId);
        if (existingItem) {
          Object.assign(existingItem, updatedItem);
          router.db.write();
          res.jsonp({
            list: todo.list,
            revision: todo.revision[0]
          });
        } else {
          res.status(404).json({ message: 'Элемент не найден' });
        }
      } else {
        res.status(409).json({ message: 'Конфликт ревизии' });
      }
    } else {
      res.status(404).json({ message: 'Элемент списка не найден' });
    }
  } else {
    next();
  }
});

server.use('/todos/:listid/:id', (req, res, next) => {
  if (req.method === 'DELETE') {
    const listId = parseInt(req.params.listid);
    const itemId = req.params.id;
    const clientRevision = parseInt(req.get('revision'));
    const todo = router.db.get('todos').find({ id: listId }).value();
    if (todo) {
      if (clientRevision === todo.revision[0]) {
        const existingItemIndex = todo.list.findIndex(item => item.id === itemId);
        if (existingItemIndex !== -1) {
          todo.list.splice(existingItemIndex, 1);
          todo.revision[0] += 1;
          router.db.write();
          res.jsonp({
            list: todo.list,
            revision: todo.revision[0]
          });
        } else {
          res.status(404).json({ message: 'Элемент не найден' });
        }
      } else {
        res.status(409).json({ message: 'Конфликт ревизии' });
      }
    } else {
      res.status(404).json({ message: 'Список не найден' });
    }
  } else {
    next();
  }
});


server.patch('/patch/:id', (req, res, next) => {
  const todoId = parseInt(req.params.id);

  // Создаем объект todo с обновленным списком
  const updatedTodo = {
    id: todoId,
    list: req.body.list,
    revision: [parseInt(req.get('revision'))],
  };

  // Выполняем запрос PATCH на /todos/:id
  req.url = `/todos/${todoId}`;
  req.method = 'PATCH';
  req.body = updatedTodo;

  server.handle(req, res, next);
});

// Переносим логику из предыдущего метода в /todos/:id
server.use('/todos/:id', (req, res, next) => {
  if (req.method === 'PATCH') {
    const todoId = parseInt(req.params.id);
    const clientRevision = parseInt(req.body.revision[0]);
    const todo = router.db.get('todos').find({ id: todoId }).value();

    if (todo) {
      const updatedList = req.body.list;
      todo.list = updatedList;
      todo.revision[0] = clientRevision;
      router.db.write();
      res.jsonp({
        list: todo.list,
        revision: todo.revision[0]
      });
    } else {
      const newList = req.body.list;
      const newRevision = clientRevision;

      const newTodo = {
        userId: todoId,
        list: newList,
        revision: [newRevision]
      };

      router.db.get('todos').push(newTodo).write();
      router.db.write();

      res.jsonp({
        list: newTodo.list,
        revision: newTodo.revision[0]
      });
    }
  } else {
    next();
  }
});




server.use('/checkuser', (req, res, next) => {
  const emailToCheck = req.body.email;

  // Ищем пользователя по email
  const user = router.db.get('users').find({ email: emailToCheck }).value();

  if (user) {
    // Находим соответствующий todo по userId
    const todo = router.db.get('todos').find({ id: user.id }).value();

    res.jsonp({
      list: todo.list,
      revision: todo.revision[0]
    });
  } else {
    res.jsonp({
      list: [],
      revision: 0
    });
  }
});

server.put('/reset/:id', (req, res, next) => {
  const userId = parseInt(req.params.id);
  const { email, password } = req.body;

  // Создаем объект пользователя с обновленным паролем
  const updatedUser = {
    id: userId,
    email,
    password,
  };

  // Выполняем запрос PUT на /users/:id
  req.url = `/users/${userId}`;
  req.body = updatedUser;
  server.handle(req, res, next);
});



server.use(router);

const port = 3000;
server.listen(port, () => {
  console.log(`JSON Server запущен на порту ${port}`);
});