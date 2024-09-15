"use client";
// ProfilePage.tsx
import { useEffect, useState } from "react";
import { getDatabase, ref, set, push, onValue, update, remove, DataSnapshot } from "firebase/database";
import { initializeApp } from "firebase/app";
import { firebaseConfig } from "../services/configFirebase";
import axios from 'axios'; // Para obter o IP do usuário
import { FaEdit, FaTrashAlt } from 'react-icons/fa'; // Importa ícones do react-icons

// Inicializar o Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

interface Comment {
  user: string;
  text: string;
  ipAddress: string;
}

interface CommentWithId extends Comment {
  id: string;
}

export default function ProfilePage() {
  const [visitorCount, setVisitorCount] = useState<number>(0);
  const [comment, setComment] = useState<string>("");
  const [comments, setComments] = useState<CommentWithId[]>([]);
  const [ipAddress, setIpAddress] = useState<string>("");
  const [messageVisible, setMessageVisible] = useState<boolean>(false);
  const [editDialogVisible, setEditDialogVisible] = useState<boolean>(false);
  const [currentEditCommentId, setCurrentEditCommentId] = useState<string>("");
  const [newCommentText, setNewCommentText] = useState<string>("");


  // Função para obter o IP do usuário
  const fetchIpAddress = async () => {
    try {
      const response = await axios.get('https://api.ipify.org?format=json');
      setIpAddress(response.data.ip);
    } catch (error) {
      console.error("Erro ao obter o IP:", error);
    }
  };

  useEffect(() => {
    // Obter o IP do visitante ao carregar a página
    fetchIpAddress();
  }, []);

  useEffect(() => {
    if (ipAddress) {
      const sanitizedIp = ipAddress.replace(/\./g, '');
  
      // Cria a referência no banco de dados usando o IP sanitizado como chave
      const ipVisitorRef = ref(database, `User/${sanitizedIp}`);
  
      // Verifica se o IP já está no banco de dados
      onValue(ipVisitorRef, (snapshot) => {
        if (snapshot.exists()) {
          // Se o IP já existe, incrementa o count
          const currentCount = snapshot.val().visitor || 0;
          update(ipVisitorRef, { visitor: currentCount + 1 });
        } else {
          // Se o IP não existe, cria o registro com count = 1
          set(ipVisitorRef, { ip: sanitizedIp, visitor: 1 });
        }
      }, { onlyOnce: true }); // Para garantir que seja chamado apenas uma vez
    }
  }, [ipAddress]);

  // Todas as visitas
  useEffect(() => {
    const visitorRef = ref(database, 'User');
    onValue(visitorRef, (snapshot) => {
      let totalVisitors = 0;
      snapshot.forEach((childSnapshot) => {
        const visitorData = childSnapshot.val();
        totalVisitors += visitorData.visitor || 0;
      });
      setVisitorCount(totalVisitors);
    });
  }, []);
  
  // Obter comentários salvos no Firebase
  useEffect(() => {
    const commentsRef = ref(database, "comments");
    const unsubscribe = onValue(commentsRef, (snapshot: DataSnapshot) => {
      const data = snapshot.val() as Record<string, Comment> | null;
      const loadedComments = data
        ? Object.keys(data).map((key) => ({ id: key, ...data[key] }))
        : [];
      setComments(loadedComments);
    });

    // Cleanup do listener
    return () => unsubscribe();
  }, []);

  // Adicionar novo comentário
  const handleAddComment = () => {
    if (comment.trim()) {
      // Extrair os últimos 4 dígitos do IP
      const lastFourDigits = ipAddress.split('.').pop() || '0000';
      
      const newCommentRef = push(ref(database, "comments"));
      set(newCommentRef, {
        ipAddress: ipAddress,
        text: `User${lastFourDigits}: ${comment}`,
      });
      setComment("");
    }
  };

// Editar comentário
const handleEditComment = (id: string) => {
  setCurrentEditCommentId(id);
  const commentRef = ref(database, `comments/${id}`);
  onValue(commentRef, (snapshot: DataSnapshot) => {
    const comment = snapshot.val();
    // Verifica se o IP do comentário corresponde ao IP do usuário ou se o usuário é o autor
    if (comment.ipAddress === ipAddress) {
      setNewCommentText(comment.text);
      setEditDialogVisible(true);
    }
  });
};

const handleSaveEdit = () => {
  if (currentEditCommentId && newCommentText.trim()) {
    const commentRef = ref(database, `comments/${currentEditCommentId}`);
    onValue(commentRef, (snapshot: DataSnapshot) => {
      const comment = snapshot.val();
      // Verifica se o IP do comentário corresponde ao IP do usuário
      if (comment.ipAddress === ipAddress) {
        update(commentRef, { text: newCommentText });
        setEditDialogVisible(false);
        setNewCommentText("");
      }
    });
  }
};

const handleCancelEdit = () => {
  setEditDialogVisible(false);
  setNewCommentText("");
};

// Deletar comentário
const handleDeleteComment = (id: string) => {
  const commentRef = ref(database, `comments/${id}`);
  onValue(commentRef, (snapshot: DataSnapshot) => {
    const comment = snapshot.val();
    // Verifica se o IP do comentário corresponde ao IP do usuário
    if (comment.ipAddress === ipAddress) {
      remove(commentRef);
    }
  });
};
  
  useEffect(() => {
    // Adicionar a regra de animação dinamicamente
    const style = document.createElement("style");
    style.innerHTML = `
    @keyframes fadeIn {
      0% { opacity: 0; }
      100% { opacity: 1; }
    }
    @media (min-width: 1024px) {
      .coment {
        margin-left:72px !important;
      }
      .textarea {
        width: 88% !important;
      }
    }
    /* Barra de rolagem minimalista */
    ::-webkit-scrollbar {
      width: 6px;
    }
    ::-webkit-scrollbar-track {
      background: #f1f1f1;
    }
    ::-webkit-scrollbar-thumb {
      background: #888;
      border-radius: 4px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: #555;
    }
  `;
    document.head.appendChild(style);

    // Mostrar a mensagem após 1 segundo
    const timer = setTimeout(() => {
      setMessageVisible(true);
    }, 800);

    // Cleanup do timer e remover o estilo quando o componente desmontar
    return () => {
      clearTimeout(timer);
      document.head.removeChild(style);
    };
  }, []);

  const styles: { [key: string]: React.CSSProperties } = {
    pageContainer: {
      fontFamily: "Arial, sans-serif",
      backgroundColor: "#f4f4f4",
      minHeight: "100vh",
    },
    topBanner: {
      backgroundColor: "#4CAF50",
      height: "120px",
      position: "relative",
      marginBottom: "100px",

    },
    profileImageContainer: {
      textAlign: "center",
      position: "absolute",
      top: "19%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      border: "5px solid #fff",
      borderRadius: "50%",
      
    },
    profileImage: {
      borderRadius: "50%",
      width: "150px",
      height: "150px",
    },
    name: {
      textAlign: "center",
      color: "#333",
      fontSize: "1.8rem",
    },
    visitor: {
      textAlign: "center",
      fontWeight: "bold",
    },
    messageContainer: {
      textAlign: "center",
      margin: "2% 15%",
      animation: "fadeIn 1s",
    },
    message: {
      backgroundColor: "#e0f7fa",
      padding: "10px",
      borderRadius: "5px",
      display: "inline-block",
    },
    commentsContainer: {
      marginTop: "20px",
    },
    comment: {
      marginBottom: "10px",
    },
    coment: {
      marginLeft: "20px",
      fontWeight: "bold"
    },
    commentBalloon: {
      backgroundColor: "#e1ffc7",
      borderRadius: "15px",
      padding: "5px",
      maxWidth: "90%",
      margin: "5px auto",
      position: "relative",
      display: "flex",
      alignItems: "center",
    },
    commentText: {
      margin: 0,
      flex: 1,
    },
    editButton: {
      backgroundColor: "transparent",
      border: "none",
      cursor: "pointer",
      color: "#464646",
    },
    deleteButton: {
      backgroundColor: "transparent",
      border: "none",
      cursor: "pointer",
      color: "#464646",
    },
    icon: {
      width: "15px",
      height: "15px",
      marginLeft: "10px",
    },
    commentForm: {
      marginTop: "20px",
      display: "flex",
      flexDirection: "column",
    },
    textarea: {
      width: "85%",
      height: "80px",
      padding: "10px",
      borderRadius: "5px",
      border: "1px solid #ccc",
      margin: "auto",
    },
    submitButton: {
      backgroundColor: "#4CAF50",
      color: "#fff",
      border: "none",
      borderRadius: "5px",
      padding: "10px",
      cursor: "pointer",
      width: "90%",
      margin: "2% auto"
    },
    editDialog: {
      position: "fixed",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      backgroundColor: "#fff",
      padding: "20px",
      borderRadius: "5px",
      boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)",
      zIndex: 1000,
    }, 
  };

  return (
    <div style={styles.pageContainer}>
      <div style={styles.topBanner}></div>
      <div style={styles.profileImageContainer}>
        <img src="/perfil.png" alt="Profile" style={styles.profileImage} />
      </div>
      <h1 style={styles.name}>John Linek Batalha</h1>
      <p style={styles.visitor}>Número de visitantes: {visitorCount}</p>
      {messageVisible && (
        <div style={styles.messageContainer}>
          <div style={styles.message}>Olá!👋 Obrigado pela visita, isso foi apenas um teste! 😉</div>
        </div>
      )}
      <p className="coment" style={styles.coment}>Comentário:</p>
      <div style={styles.commentsContainer}>
  {comments.map((c) => (
    <div key={c.id} style={styles.comment}>
      <div style={styles.commentBalloon}>
        <p style={styles.commentText}>{c.text}</p>
        {c.ipAddress === ipAddress && (
          <div>
            <button
              onClick={() => handleEditComment(c.id)}
              style={styles.editButton}
            >
              <FaEdit style={styles.icon} />
            </button>
            <button
              onClick={() => handleDeleteComment(c.id)}
              style={styles.deleteButton}
            >
              <FaTrashAlt style={styles.icon} />
            </button>
          </div>
        )}
      </div>
    </div>
  ))}
</div>

      <div style={styles.commentForm}>
        <textarea
          className="textarea"
          style={styles.textarea}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Adicionar um comentário..."
        />
        <button style={styles.submitButton} onClick={handleAddComment}>
          Adicionar comentário
        </button>
      </div>
      {editDialogVisible && (
        <div style={styles.editDialog}>
          <textarea
            style={styles.textarea}
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
          />
          <button style={styles.submitButton} onClick={handleSaveEdit}>
            Save
          </button>
          <button style={styles.submitButton} onClick={handleCancelEdit}>
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
