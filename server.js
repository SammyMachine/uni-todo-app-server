const jsonServer = require('json-server');
const auth = require('json-server-auth');
const server = jsonServer.create();
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults();
const rules = auth.rewriter({
  todos: 660
});
module.exports = server;

server.db = router.db;

server.use(middlewares);

server.use(rules)
server.use(auth);

server.use(jsonServer.bodyParser);

server.use('/todos/:listid', (req, res, next) => {
  if (req.method === 'GET') {
    const todoId = parseInt(req.params.listid);
    const todoList = router.db.get('todos').find({ id: todoId }).value();
    if (todoList) {
      res.jsonp({
        list: todoList.list,
        revision: todoList.revision[0]
      });
    } else {
      res.status(404).json({
        message: 'Список не найден'
      });
    }
  } else {
    next();
  }
});

server.post('/todos/:listid', (req, res, next) => {
  if (req.method === 'POST') {
    const todoId = parseInt(req.params.listid);
    const newItem = req.body;
    const clientRevision = parseInt(req.get('revision'));
    const todo = router.db.get('todos').find({ id: todoId }).value();

    if (todo) {
      if (clientRevision === todo.revision[0]) {
        todo.revision[0] += 1;
        todo.list.push(newItem);
        router.db.write();
        res.jsonp({
          list: todo.list,
          revision: todo.revision[0]
        });
      } else {
        res.status(409).json({
          message: 'Конфликт ревизии'
        });
      }
    } else {
      // Элемент списка не существует, создаем новый
      const newTodo = {
        id: todoId,
        list: [newItem],
        revision: [0],
      };

      // Добавляем новый элемент списка в базу данных
      router.db.get('todos').push(newTodo).write();

      res.jsonp({
        list: newTodo.list,
        revision: newTodo.revision[0]
      });
    }
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


server.use('/todos/:listid', (req, res, next) => {
  if (req.method === 'PATCH') {
    const listId = parseInt(req.params.listid);
    const clientRevision = parseInt(req.get('revision'));
    const todo = router.db.get('todos').find({ id: listId }).value();
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
      if (!newList || !newRevision) {
        res.status(400).json({ message: 'Отсутствуют необходимые данные' });
        return;
      }
      const newTodo = {
        id: listId,
        list: newList,
        revision: [newRevision]
      };
      router.db.get('todos').push(newTodo).write();
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
      revision: todo.revision[0],
      userId: user.id
    });
  } else {
    res.jsonp({
      list: [],
      revision: 0,
      userId: -1
    });
  }
});

server.use('/reset/:id', (req, res, next) => {
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