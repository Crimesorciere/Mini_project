import { getAuth, createUserWithEmailAndPassword, signOut, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, getDoc, setDoc, getDocs, getDocFromCache, addDoc, onSnapshot, doc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";
import { getDatabase, ref, set, child, get, update, remove } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js';

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
const user = localStorage.getItem('teacher_id');
console.log('--------------->>>>',user);
document.addEventListener('DOMContentLoaded', function () {
    const generateMarksButton = document.getElementById('generate-marks');
    const resultDiv = document.getElementById('result');

    generateMarksButton.addEventListener('click', async function () {
        // Generate a random mark
        const randomMark = Math.floor(Math.random() * 100) + 1; // Random mark between 1 and 100

        // Display the random mark in the resultDiv
        resultDiv.innerHTML = `<p>Random Mark: ${randomMark}</p>`;

        // try {
        //     // Send the random mark to the backend to update all students
        //     const response = await fetch('http://127.0.0.1:8000/update-marks', {
        //         method: 'POST',
        //         headers: {
        //             'Content-Type': 'application/json'
        //         },
        //         body: JSON.stringify({ mark: randomMark })
        //     });

        //     if (response.ok) {
        //         console.log('Marks updated successfully for all students.');
        //     } else {
        //         console.error('Failed to update marks.');
        //     }
        // } catch (error) {
        //     console.error('Error:', error);
        // }
    });

    const classroom = document.querySelector('#add-classroom');
    classroom.addEventListener('click', async (e) => {
        console.log('Button clicked: adding class table');
        // const class_name_container = document.querySelector('#class-name-container');
        // class_name_container.style.display = "block";
        // const class_name = document.querySelector('#class-name');
        // const className = class_name.value;
        // console.log(class_name);
        console.log('--------------->>>> ${user}');
        const className = 'A';
        const teachRef = ref(realtimeDB, `role/teacher/${user}/classroom`);
        await set(teachRef, {
            className
        });



        
        console.log('Class Name:', className);
        localStorage.setItem('classname',className);
        const ab = localStorage.getItem('classname');
        console.log(ab);
        try {
            const classCollection = collection(db, className);
            console.log('Class Collection:', classCollection);

            const studentsRef = ref(realtimeDB, 'role/student');
            console.log('Students Ref:', studentsRef);

            const studentsSnapshot = await get(studentsRef);
            console.log('Students Snapshot:', studentsSnapshot.exists());

            if (studentsSnapshot.exists()) {
                // Extract students data
                const students = studentsSnapshot.val();
                console.log('Students Data:', students);

                const studentUIDs = Object.keys(students);
                console.log('Student UIDs:', studentUIDs);

                // Add a document for each student
                for (let uid of studentUIDs) {
                    
                    const student = students[uid];
                    if(student.class === className){
                    console.log('Student:', student);

                    const studentDoc = doc(classCollection, uid);
                    console.log('Student Doc:', studentDoc);

                    await setDoc(studentDoc, { email: student.email });
                    console.log(`Document created for student UID: ${uid}`);
                    }
                }
                console.log('All student documents created successfully.');
            } else {
                console.error('No students found in Realtime Database.');
            }
        } catch (error) {
            console.error('Error creating classroom:', error);
        }
    });

    const test1 = document.querySelector('#test-1');
    test1.addEventListener('click', async (e) => {
        window.location.href = '/test.html';


    });
});
