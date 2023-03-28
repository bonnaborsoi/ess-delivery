import express from 'express';
import admin from 'firebase-admin';
import bodyParser from 'body-parser';
import cors from 'cors';
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

const app = express();

app.use(cors());

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

//Configuração firebase
admin.initializeApp({
  credential: admin.credential.cert("../firebaseConfig.json")
});


// Rota Post do cadastro de login
let userId;
app.post('/register-login', (req, res) => {
  console.log('POST login');
  const data = req.body;
  admin.auth().createUser({
    email: data.email,
    password: data.senha
  })
  .then(userRecord => {
    userId = userRecord.uid;
    const responseData = { id: userRecord.uid, ...data };
    // Adicionar o campo "restauranteId" no documento do usuário
    admin.firestore()
      .collection('usuarios')
      .doc(userRecord.uid)
      .set({ restauranteId: null, ...data })
      .then(() => {
        res.json(responseData);
      })
      .catch(err => {
        console.error(err);
        res.status(500).send('Erro ao salvar usuário');
      });
  })
  .catch(err => {
    console.error(err);
    res.status(500).send('Erro ao criar usuário');
  });
});


// Rota Post do cadastro de restaurante
app.post('/register-restaurant', (req, res) => {
  console.log('POST restaurant');
  const data = req.body;
  admin.firestore()
    .collection('restaurantes')
    .add(data)
    .then(docRef => {
      const responseData = { id: docRef.id, ...data };
      // Atualizar o documento do usuário com o ID do restaurante
      admin.firestore()
        .collection('usuarios')
        .doc(userId)
        .update({ restauranteId: docRef.id })
        .then(() => {
          res.json(responseData);
        })
        .catch(err => {
          console.error(err);
          res.status(500).send('Erro ao atualizar o usuário com o ID do restaurante');
        });
    })
    .catch(err => {
      console.error(err);
      res.status(500).send('Erro ao salvar restaurante');
    });
});


// Rota GET do restaurante
app.get('/update-register', (req, res) => {
  //const token = req.headers.authorization.split(' ')[1];
  //const decodedToken = jwt.decode(token);
  //const userId = decodedToken.sub;
  const userId = "59breiPESGPgPXKfN79gVcKRuyt2";
  
  admin.firestore()
    .collection('usuarios')
    .doc(userId)
    .get()
    .then(doc => {
      const restauranteId = doc.data().restauranteId;

      admin.firestore()
        .collection('restaurantes')
        .doc(restauranteId)
        .get()
        .then(doc => {
          const restauranteData = doc.data();
          res.json(restauranteData);
        })
        .catch(err => {
          console.error(err);
          res.status(500).send('Erro ao buscar dados do restaurante');
        });
    })
    .catch(err => {
      console.error(err);
      res.status(500).send('Erro ao buscar ID do restaurante');
    });
});

// Rota POST para autenticação de login de usuário
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Busca o usuário pelo email
    const userRecord = await admin.auth().getUserByEmail(email);

    // Verifica a senha
    const userDoc = await admin.firestore()
                               .collection('usuarios')
                               .doc(userRecord.uid)
                               .get();      

    if (userDoc.data().password == password) {
      const token = await admin.auth().createCustomToken(userRecord.uid);
      res.status(200).json({ token });
    } else {
      res.status(401).send("Senha incorreta");
    }
  } catch (error) {
    res.status(404).send("Usuário não encontrado");
  }
});

// Rota para a recuperação de senha
app.post("/password-recovery", async (req, res) =>{
  console.log('POST RECOVERY')
});


app.listen(3000, () => {
  console.log('Servidor ON em http://localhost:3000')
});

