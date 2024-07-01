from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import firebase_admin
from firebase_admin import credentials, firestore
from typing import Dict, Any
from fastapi.middleware.cors import CORSMiddleware  
app = FastAPI()
from happytransformer import HappyGeneration, GENSettings
import re
from sentence_transformers import SentenceTransformer, util
import torch
from scipy.spatial.distance import euclidean
from datasketch import MinHash
import bert_score
import Levenshtein as lev  # Import Levenshtein package
import matplotlib.pyplot as plt
# Initialize Firebase Admin SDK
cred = credentials.Certificate("D:/Aritifcial Intelligence/fierbase_3/fierbase_data.json")
firebase_admin.initialize_app(cred, {
    'databaseURL': 'https://trial3-8d757-default-rtdb.firebaseio.com/'
})

db = firestore.client()



app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this as needed for security, e.g., ['http://localhost:5500']
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
class MarksUpdate(BaseModel):
    mark: int

    

class Submission(BaseModel):
    questions: list[str]
    answers: list[str]
    student_uid: str
    teacher_uid: str
    class_name: str

def generate_three_sentence_answer(model, question, settings):
    generated_text = model.generate_text(question, args=settings).text
    sentences = re.split(r'(?<=[.!?]) +', generated_text)
    three_sentences = ' '.join(sentences[:3])
    return three_sentences

def calculate_cosine_similarity(embedding1, embedding2):
    return util.pytorch_cos_sim(embedding1, embedding2).item()

# Function to calculate Jaccard Similarity using MinHash
def calculate_jaccard_similarity(text1, text2):
    minhash1, minhash2 = MinHash(), MinHash()
    for word in text1.split():
        minhash1.update(word.encode('utf8'))
    for word in text2.split():
        minhash2.update(word.encode('utf8'))
    return minhash1.jaccard(minhash2)

# Function to calculate BERTScore Precision
def calculate_bertscore_precision(candidate, reference):
    P, _, _ = bert_score.score([candidate], [reference], lang="en", rescale_with_baseline=True)
    return P.item()

# Initialize the HappyGeneration model (this only needs to be done once)
happy_gen = HappyGeneration("GPT-NEO", "EleutherAI/gpt-neo-1.3B")
beam_settings = GENSettings(num_beams=5, max_length=100, no_repeat_ngram_size=3)
top_p_settings = GENSettings(do_sample=True, top_k=0, top_p=0.5, max_length=100)

# Initialize the Sentence-BERT model (this only needs to be done once)
sentence_model = SentenceTransformer('all-MiniLM-L6-v2')

# Check if GPU is available and use it
device = 'cuda' if torch.cuda.is_available() else 'cpu'
sentence_model = sentence_model.to(device)
cosine_sim_scores = []
jaccard_sim_scores = []
bert_precision_scores = []
final_scores = []
# @app.post("/update-marks")
# async def update_marks(marks_update: MarksUpdate):
#     try:
#         # Reference to the students in the database
#         students_ref = db.reference('role/student')
#         students = students_ref.get()

#         if not students:
#             raise HTTPException(status_code=404, detail="No students found")

#         # Update each student's marks
#         for student_id, student_data in students.items():
#             marks_ref = db.reference(f'role/student/{student_id}/marks')
#             current_marks = marks_ref.get() or {}
#             current_marks["latest_mark"] = marks_update.mark
#             marks_ref.set(current_marks)

#         return {"detail": "Marks updated successfully for all students"}
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))

@app.post("/submit-data")
async def submit_data(submission: Submission):
    # Process the submission data
    # For example, you can store it in a database or perform other actions

    print(submission)
    submissions_ref = db.collection('submissions')
    questions = submission.questions
    user_answers = submission.answers
    
    student_uid = submission.student_uid
    print('stundets id ',student_uid)
    teacher_uid = submission.teacher_uid
    class_name = submission.class_name
    cosine_sim_scores = []
    jaccard_sim_scores = []
    bert_precision_scores = []
    final_scores = []

    for question, user_answer in zip(questions, user_answers):
        generated_answer = generate_three_sentence_answer(happy_gen, question, beam_settings)
        print(f"Question: {question}")
        print(f"Generated Answer: {generated_answer}")
        print(f"User Answer: {user_answer}")

        generated_answer_embedding = sentence_model.encode(generated_answer, convert_to_tensor=True, device=device)
        user_answer_embedding = sentence_model.encode(user_answer, convert_to_tensor=True, device=device)
        # Add the submission data to the Firestore collection

        cosine_sim = calculate_cosine_similarity(generated_answer_embedding, user_answer_embedding) * 10
        jaccard_sim = calculate_jaccard_similarity(generated_answer, user_answer) * 10
        bert_precision = calculate_bertscore_precision(generated_answer, user_answer) * 10

            # Store scores in lists
        cosine_sim_scores.append(cosine_sim)
        jaccard_sim_scores.append(jaccard_sim)
        bert_precision_scores.append(bert_precision)

            # Calculate mean similarity score and determine final score out of 2
        mean_similarity = (cosine_sim + jaccard_sim + bert_precision) / 3
        final_score = 2 if mean_similarity >= 6.66 else 1 if mean_similarity >= 3.33 else 0
        final_scores.append(final_score)
            # Print the scaled scores and final score
        print(f"Cosine Similarity Score: {cosine_sim:.2f}")
        print(f"Jaccard Similarity Score: {jaccard_sim:.2f}")
        print(f"BERTScore Precision: {bert_precision:.2f}")
        print(f"Final Score (out of 2): {final_score}\n")


    submissions_ref.add({
       
        'questions': questions,
        'answers': user_answers,
        'scores': final_scores, 
        'student_uid': student_uid,
        'teacher_uid': teacher_uid,
        'class': class_name,
    })
    return {"message": "Data submitted successfully"}

