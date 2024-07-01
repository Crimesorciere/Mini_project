import { getAuth, createUserWithEmailAndPassword, signOut, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, getDoc, setDoc, getDocs, getDocFromCache, addDoc, onSnapshot, doc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";
import { getDatabase, ref, set,child,get,update,remove } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js';

const firebaseConfig = {
    apiKey: "AIzaSyCJli22BQGRCHyTvrMBVD4leAwJ8guZq6g",
    authDomain: "trial3-8d757.firebaseapp.com",
    projectId: "trial3-8d757",

    appId: "1:503843990927:web:83a72336ff06ea79af6ffa",
    measurementId: "G-XH7PG479RT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// make auth and firestore references
const auth = getAuth(app);
const db = getFirestore(app);
const realtimeDB = getDatabase(app);

if (document.readyState !== 'loading') {
    myInitCode();
} else {
    document.addEventListener('DOMContentLoaded', function () {
        myInitCode();
    });
}

function myInitCode() {
    const signupRole = document.querySelector('#signup-role-field');
    const student = document.querySelectorAll('.student');



    signupRole.addEventListener('change', function () {
        if (signupRole.value === 'student') {
            student.forEach(field => {
                field.style.display = 'block';
            });
        } else {
            student.forEach(field => {
                field.style.display = 'none';
            });
        }
    });



    const signupForm = document.querySelector('#signup-form');
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
       console.log('hello');
       
    const email = signupForm['signup-email'].value;
    const password = signupForm['signup-password'].value;
    const role = signupRole.value.toLowerCase();
    const userClass = signupForm['signup-class'].value;
    const rollNumber = parseInt(signupForm['signup-roll-number'].value);
   const name = signupForm['signup-name'].value;
    
    const college = signupForm['signup-college'].value;

    try {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        const userId = cred.user.uid;
  
        if (role === 'student') {
          const studentRef = ref(realtimeDB, 'role/student/' + userId);
          await set(studentRef, {
            email,
            name,
            class: userClass,
            rollNumber
           
          });
          window.location.href = '/student.html';
        }
        if(role === 'teacher'){
            const teachRef = ref(realtimeDB, 'role/teacher/' + userId);
            await set(teachRef, {
                email,
                name,
                college
            });
        }
  
        console.log('User registered and data saved');
        signupForm.reset();
      } catch (error) {
        console.error('Error during sign up:', error.message);
        alert('Error during sign up: ' + error.message);
      }

    });

    const loginForm = document.querySelector('#login-form');
    const loginbutton = document.querySelector('#login-button');
    loginbutton.addEventListener('click', async (e) => {
        
       console.log('hello');
       e.preventDefault();
       const email = loginForm['login-email'].value;
       const password = loginForm['login-password'].value;
       const role = loginForm['login-role'].value;
       try {
         const cred = await signInWithEmailAndPassword(auth, email, password);
         if(role === 'student'){

            window.location.href = '/student.html';
         }
         if(role === 'teacher'){
            const user_cred = cred.user.uid;
            console.log(user_cred);
            localStorage.setItem('teacher_id',user_cred);
            window.location.href = '/teacher.html';
         }
       
       } catch (error) {
         console.error('Error during sign in:', error.message);
         
       }alert('Error during sign in: ' + error.message);

    });

    }