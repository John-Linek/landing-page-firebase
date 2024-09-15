import { initializeApp, FirebaseOptions } from "firebase/app";
import { getDatabase } from "firebase/database";

// Configuração do Firebase
export const firebaseConfig: FirebaseOptions = {
  apiKey: "AIzaSyBR2duScvc2iGemfsbECo7JkR3sEErUS1c",
  authDomain: "langingpageteste.firebaseapp.com",
  projectId: "langingpageteste",
  storageBucket: "langingpageteste.appspot.com",
  messagingSenderId: "882991203053",
  appId: "1:882991203053:web:f4301382c4d10ec565c2e4"
};

// Inicializar o Firebase e exportar o banco de dados
const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
