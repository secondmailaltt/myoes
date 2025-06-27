// // src/pages/GiveExam.jsx
// import React, { useState, useEffect, useRef } from 'react';
// import { useNavigate, useParams } from 'react-router-dom';
// import { BiLoaderAlt } from 'react-icons/bi';  // or any spinner icon

// export default function GiveExam() {
//   const { id: examId } = useParams();
//   const navigate = useNavigate();
//   const imgRef = useRef(null);
//   const [feedLoaded, setFeedLoaded] = useState(false);


//   // exam state
//   const [exam, setExam] = useState(null);
//   const [answers, setAnswers] = useState({});
//   const [timeLeft, setTimeLeft] = useState(null);
//   const [submitted, setSubmitted] = useState(false);
//   const [alreadySubmitted, setAlreadySubmitted] = useState(false);
//   const [score, setScore] = useState(null);
//   const [warningCount, setWarningCount] = useState(0);

//   // 1) Restore progress
//   useEffect(() => {
//     (async () => {
//       try {
//         const token = localStorage.getItem('token');
//         const res = await fetch(`/api/exams/${examId}/progress`, {
//           headers: { Authorization: `Bearer ${token}` }
//         });
//         if (res.ok) {
//           const prog = await res.json();
//           if (prog.timeLeft != null) {
//             setAnswers(prog.answers || {});
//             setTimeLeft(prog.timeLeft);
//           }
//         }
//       } catch (err) {
//         console.error('Load progress error:', err);
//       }
//     })();
//   }, [examId]);

//   // 2) Fetch exam or past submission
//   useEffect(() => {
//     if (!examId) return navigate(-1);
//     (async () => {
//       try {
//         const token = localStorage.getItem('token');
//         const res = await fetch(`/api/exams/${examId}/student`, {
//           headers: { Authorization: `Bearer ${token}` }
//         });
//         if (!res.ok) throw new Error();
//         const data = await res.json();

//         if (data.alreadySubmitted) {
//           setAlreadySubmitted(true);
//           setSubmitted(true);
//           setScore(data.score);
//           setExam({ questions: data.questions || [], duration: 0 });
//         } else {
//           setExam(data);
//         }
//       } catch {
//         navigate(-1);
//       }
//     })();
//   }, [examId, navigate]);

//   // 3) Initialize timer
//   useEffect(() => {
//     if (exam && timeLeft == null) {
//       setTimeLeft(exam.duration * 60);
//     }
//   }, [exam, timeLeft]);

//   // 4) Countdown
//   useEffect(() => {
//     if (timeLeft == null || submitted) return;
//     if (timeLeft <= 0) {
//       handleSubmit();
//       return;
//     }
//     const id = setTimeout(() => setTimeLeft(t => t - 1), 1000);
//     return () => clearTimeout(id);
//   }, [timeLeft, submitted]);

//   // 5) Anti-cheat: tab switch
//   useEffect(() => {
//     const onVisibility = () => {
//       if (document.hidden && !submitted && !alreadySubmitted) {
//         setWarningCount(c => c + 1);
//       }
//     };
//     document.addEventListener('visibilitychange', onVisibility);
//     return () => document.removeEventListener('visibilitychange', onVisibility);
//   }, [submitted, alreadySubmitted]);

//   useEffect(() => {
//     if (warningCount === 1) {
//       alert('Warning: Tab change detected! Next change auto-submits.');
//     }
//     if (warningCount === 2 && !submitted && !alreadySubmitted) {
//       alert('Tab changed again. Auto-submitting.');
//       handleSubmit();
//     }
//   }, [warningCount, submitted, alreadySubmitted]);

//   // 6) Persist progress
//   useEffect(() => {
//     if (!submitted && exam && timeLeft != null) {
//       const token = localStorage.getItem('token');
//       fetch(`/api/exams/${examId}/progress`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           Authorization: `Bearer ${token}`
//         },
//         body: JSON.stringify({ answers, timeLeft })
//       }).catch(console.error);
//     }
//   }, [answers, timeLeft, exam, submitted, examId]);

//   // 7) Release camera on unload or route change
//   useEffect(() => {
//     const releaseCamera = () => {
//       const url = 'http://192.168.10.17:5000/release_camera';
//       if (navigator.sendBeacon) {
//         navigator.sendBeacon(url);
//       } else {
//         fetch(url, { method: 'POST', mode: 'no-cors' });
//       }
//     };
//     window.addEventListener('beforeunload', releaseCamera);
//     return () => {
//       // release on unmount (route change)
//       releaseCamera();
//       window.removeEventListener('beforeunload', releaseCamera);
//     };
//   }, []);

//   // option select handler
//   const handleChange = (qIdx, optIdx) =>
//     setAnswers(a => ({ ...a, [qIdx]: optIdx }));

//   // submit exam
//   async function handleSubmit() {
//     if (submitted || alreadySubmitted) return;
//     setSubmitted(true);

//     const answersArr = (exam.questions || []).map((_, i) =>
//       answers.hasOwnProperty(i) ? answers[i] : null
//     );
//     const rawScore = (exam.questions || []).reduce(
//       (sum, q, i) => sum + (answersArr[i] === q.correctAnswerIndex ? 1 : 0),
//       0
//     );
//     setScore(rawScore);

//     try {
//       const token = localStorage.getItem('token');
//       await fetch(`/api/exams/${examId}/submit`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           Authorization: `Bearer ${token}`
//         },
//         body: JSON.stringify({ answers: answersArr, score: rawScore })
//       });
//       await fetch(`/api/exams/${examId}/progress`, {
//         method: 'DELETE',
//         headers: { Authorization: `Bearer ${token}` }
//       });
//     } catch (err) {
//       console.error('Submit error:', err);
//     }
//   }

//   // format timer mm:ss
//   const formatTime = secs => {
//     const m = String(Math.floor(secs / 60)).padStart(2, '0');
//     const s = String(secs % 60).padStart(2, '0');
//     return `${m}:${s}`;
//   };

//   return (
//     <div className="min-h-screen bg-gray-100 flex flex-col lg:flex-row">
//       {/* Camera & Timer Sidebar */}
//       <div className="w-full lg:w-80 bg-white p-6 flex flex-col sticky top-0 h-screen">
//         {/* Perfect-square camera box */}
//         <div
//           className="bg-black w-full mb-4 rounded-lg shadow-lg overflow-hidden relative"
//           style={{ paddingTop: '100%' }} // 1:1 aspect ratio
//         >
//           {/* <iframe
//             src="http://192.168.10.17:5000/camera"
//             title="Live Camera"
//             className="absolute top-0 left-0 w-full h-full"
//             frameBorder="0"
//             allow="autoplay"
//           /> */}
//           <iframe
//            src="http://192.168.10.17:5000/camera"
//            title="Live Camera"
//            className="absolute top-0 left-0 w-full h-full"
//            frameBorder="0"
//            allow="autoplay"
//            onLoad={() => setFeedLoaded(true)}
//          />
//          {!feedLoaded && (
//            <div className="absolute inset-0 flex items-center justify-center bg-black">
//              <BiLoaderAlt className="animate-spin text-white text-4xl" />
//            </div>
//          )}
//         </div>

//         {/* Timer display */}
//         <div className="text-4xl font-mono mb-2 text-center">
//           {timeLeft != null ? formatTime(timeLeft) : '--:--'}
//         </div>
//         <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
//           <div
//             className="bg-[#002855] h-2 rounded-full transition-all duration-500"
//             style={{
//               width: exam
//                 ? `${((exam.duration * 60 - (timeLeft || 0)) /
//                     (exam.duration * 60)) *
//                     100}%`
//                 : '0%'
//             }}
//           />
//         </div>
//       </div>

//       {/* Questions & Submit */}
//       <div className="flex-1 p-6 lg:p-12 overflow-auto">
//         {!exam ? (
//           <div className="text-center text-gray-500">Loading exam…</div>
//         ) : alreadySubmitted || submitted ? (
//           <div className="text-center">
//             <h2 className="text-4xl font-bold text-[#002855] mb-4">
//               Your Score
//             </h2>
//             <p className="text-2xl">
//               {score} / {exam.questions.length}
//             </p>
//           </div>
//         ) : (
//           <>
//             {exam.questions.map((q, i) => (
//               <div
//                 key={i}
//                 className="bg-white rounded-xl shadow-md p-6 mb-8"
//               >
//                 <h3 className="text-2xl font-semibold text-[#002855] mb-3">
//                   Q{i + 1}. {q.questionText}
//                 </h3>
//                 <div className="space-y-3">
//                   {q.options.map((opt, j) => (
//                     <label
//                       key={j}
//                       className="flex items-center space-x-3 text-gray-700"
//                     >
//                       <input
//                         type="radio"
//                         name={`q${i}`}
//                         checked={answers[i] === j}
//                         onChange={() => handleChange(i, j)}
//                         className="accent-[#002855] h-5 w-5"
//                       />
//                       <span>{opt}</span>
//                     </label>
//                   ))}
//                 </div>
//               </div>
//             ))}

//             <div className="text-center mt-6">
//               <button
//                 onClick={handleSubmit}
//                 className="px-8 py-3 bg-[#002855] text-white text-lg rounded hover:bg-[#001f47] transition"
//               >
//                 Submit
//               </button>
//             </div>
//           </>
//         )}
//       </div>
//     </div>
//   );
// }












// // src/pages/GiveExam.jsx
// import React, { useState, useEffect } from 'react';
// import { useNavigate, useParams } from 'react-router-dom';
// import { BiLoaderAlt } from 'react-icons/bi';

// export default function GiveExam() {
//   const { id: examId } = useParams();
//   const navigate       = useNavigate();

//   // JWT aur userId LocalStorage se lo
//   const token  = localStorage.getItem('token');    // 'Bearer <JWT>'
//   // const userId = localStorage.getItem('userId');   // ObjectId string

//   const [exam, setExam]                       = useState(null);
//   const [answers, setAnswers]                 = useState({});
//   const [timeLeft, setTimeLeft]               = useState(null);
//   const [submitted, setSubmitted]             = useState(false);
//   const [alreadySubmitted, setAlreadySubmitted] = useState(false);
//   const [score, setScore]                     = useState(null);
//   const [warningCount, setWarningCount]       = useState(0);
//   const [feedLoaded, setFeedLoaded]           = useState(false);

//   // 1) Restore any saved progress
//   useEffect(() => {
//     if (!examId) return;
//     (async () => {
//       try {
//         const res = await fetch(`/api/exams/${examId}/progress`, {
//           headers: { Authorization: `Bearer ${token}` }
//         });
//         if (res.ok) {
//           const prog = await res.json();
//           if (prog.timeLeft != null) {
//             setAnswers(prog.answers || {});
//             setTimeLeft(prog.timeLeft);
//           }
//         }
//       } catch (err) {
//         console.error('Progress load error:', err);
//       }
//     })();
//   }, [examId, token]);

//   // 2) Fetch exam details or past submission
//   useEffect(() => {
//     if (!examId) return navigate(-1);
//     (async () => {
//       try {
//         const res = await fetch(`/api/exams/${examId}/student`, {
//           headers: { Authorization: `Bearer ${token}` }
//         });
//         if (!res.ok) throw new Error();
//         const data = await res.json();

//         if (data.alreadySubmitted) {
//           setAlreadySubmitted(true);
//           setSubmitted(true);
//           setScore(data.score);
//           setExam({ questions: data.questions || [], duration: 0 });
//         } else {
//           setExam(data);
//         }
//       } catch {
//         navigate(-1);
//       }
//     })();
//   }, [examId, navigate, token]);

//   // 3) Initialize timer if not restored
//   useEffect(() => {
//     if (exam && timeLeft == null && !alreadySubmitted) {
//       setTimeLeft(exam.duration * 60);
//     }
//   }, [exam, timeLeft, alreadySubmitted]);

//   // 4) Countdown and auto-submit when zero
//   useEffect(() => {
//     if (timeLeft == null || submitted) return;
//     if (timeLeft <= 0) {
//       handleSubmit();
//       return;
//     }
//     const id = setTimeout(() => setTimeLeft(t => t - 1), 1000);
//     return () => clearTimeout(id);
//   }, [timeLeft, submitted]);

//   // 5) Anti-cheat: tab switch warning & auto-submit
//   useEffect(() => {
//     const onVisibility = () => {
//       if (document.hidden && !submitted && !alreadySubmitted) {
//         setWarningCount(c => c + 1);
//       }
//     };
//     document.addEventListener('visibilitychange', onVisibility);
//     return () => document.removeEventListener('visibilitychange', onVisibility);
//   }, [submitted, alreadySubmitted]);

//   useEffect(() => {
//     if (warningCount === 1) {
//       alert('Warning: Tab change detected! Next change auto-submits.');
//     }
//     if (warningCount >= 2 && !submitted && !alreadySubmitted) {
//       alert('Tab changed again. Auto-submitting.');
//       handleSubmit();
//     }
//   }, [warningCount, submitted, alreadySubmitted]);

//   // 6) Persist progress on each change
//   useEffect(() => {
//     if (!submitted && exam && timeLeft != null) {
//       (async () => {
//         try {
//           await fetch(`/api/exams/${examId}/progress`, {
//             method: 'POST',
//             headers: {
//               'Content-Type': 'application/json',
//               Authorization: `Bearer ${token}`
//             },
//             body: JSON.stringify({ answers, timeLeft })
//           });
//         } catch (err) {
//           console.error('Progress save error:', err);
//         }
//       })();
//     }
//   }, [answers, timeLeft, exam, submitted, examId, token]);

//   // 7) Release camera on unmount or page close
//   useEffect(() => {
//     const release = () => {
//       const url = 'http://192.168.10.17:5000/release_camera';
//       if (navigator.sendBeacon) {
//         navigator.sendBeacon(url);
//       } else {
//         fetch(url, { method: 'POST', mode: 'no-cors' });
//       }
//     };
//     window.addEventListener('beforeunload', release);
//     return () => {
//       release();
//       window.removeEventListener('beforeunload', release);
//     };
//   }, []);

//   //  inside GiveExam component

// // auto-submit hone pe results pe redirect
// useEffect(() => {
//   // sirf tab chalana jab student ne abhi tak submit na kia ho
//   if (submitted || alreadySubmitted) return;

//   const interval = setInterval(async () => {
//     try {
//       const res = await fetch(`/api/exams/${examId}/progress`, {
//         headers: { Authorization: `Bearer ${token}` }
//       });
//       if (res.status === 404) {
//         clearInterval(interval);
//         // exam backend ne force-submit kar diya
//         navigate(`/student/results/${examId}`);
//       }
//     } catch (err) {
//       console.error('Polling error:', err);
//     }
//   }, 5000);

//   return () => clearInterval(interval);
// }, [examId, navigate, submitted, alreadySubmitted]);


//   // Handle option select
//   const handleChange = (qIdx, optIdx) => {
//     setAnswers(a => ({ ...a, [qIdx]: optIdx }));
//   };

//   // Submit exam (manual or auto)
//   async function handleSubmit() {
//     if (submitted || alreadySubmitted) return;
//     setSubmitted(true);

//     const answersArr = (exam.questions || []).map((_, i) =>
//       answers.hasOwnProperty(i) ? answers[i] : null
//     );
//     const rawScore = (exam.questions || []).reduce(
//       (sum, q, i) => sum + (answersArr[i] === q.correctAnswerIndex ? 1 : 0),
//       0
//     );
//     setScore(rawScore);

//     try {
//       // 1) Student-initiated submit
//       await fetch(`/api/exams/${examId}/submit`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           Authorization: `Bearer ${token}`
//         },
//         body: JSON.stringify({ answers: answersArr, score: rawScore })
//       });

//       // 2) Clear saved progress
//       await fetch(`/api/exams/${examId}/progress`, {
//         method: 'DELETE',
//         headers: { Authorization: `Bearer ${token}` }
//       });
//     } catch (err) {
//       console.error('Submit error:', err);
//     }
//   }

//   // Timer formatter mm:ss
//   const formatTime = secs => {
//     const m = String(Math.floor(secs / 60)).padStart(2, '0');
//     const s = String(secs % 60).padStart(2, '0');
//     return `${m}:${s}`;
//   };

//   // Proctoring feed URL with JWT
//   const streamUrl =
//     `http://192.168.10.17:5000/video_feed`
//     + `?student=${userId}`
//     + `&exam=${examId}`
//     + `&token=${encodeURIComponent(token)}`;

//   return (
//     <div className="min-h-screen bg-gray-100 flex flex-col lg:flex-row">
//       {/* === Sidebar: Camera & Timer === */}
//       <div className="w-full lg:w-80 bg-white p-6 flex flex-col sticky top-0 h-screen">
//         <div
//           className="bg-black w-full mb-4 rounded-lg shadow-lg overflow-hidden relative"
//           style={{ paddingTop: '100%' }}
//         >
//           <img
//             src={streamUrl}
//             alt="Proctoring feed"
//             className="absolute top-0 left-0 w-full h-full object-cover"
//             onLoad={() => setFeedLoaded(true)}
//             onError={() => console.error('Feed load error')}
//           />
//           {!feedLoaded && (
//             <div className="absolute inset-0 flex items-center justify-center bg-black">
//               <BiLoaderAlt className="animate-spin text-white text-4xl" />
//             </div>
//           )}
//         </div>

//         {/* Timer */}
//         <div className="text-4xl font-mono mb-2 text-center">
//           {timeLeft != null ? formatTime(timeLeft) : '--:--'}
//         </div>
//         <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden mb-4">
//           <div
//             className="bg-[#002855] h-2 rounded-full transition-all duration-500"
//             style={{
//               width: exam
//                 ? `${((exam.duration * 60 - (timeLeft||0)) / (exam.duration * 60)) * 100}%`
//                 : '0%'
//             }}
//           />
//         </div>

//         {alreadySubmitted && (
//           <div className="text-center text-red-600 font-semibold">
//             Aapne pehle hi exam submit kar diya hai.
//           </div>
//         )}
//       </div>

//       {/* === Main: Questions & Results === */}
//       <div className="flex-1 p-6 lg:p-12 overflow-auto">
//         {!exam ? (
//           <div className="flex justify-center items-center h-full text-gray-500">
//             Loading exam…
//           </div>
//         ) : submitted || alreadySubmitted ? (
//           <div className="text-center">
//             <h2 className="text-4xl font-bold text-[#002855] mb-4">
//               Your Score
//             </h2>
//             <p className="text-2xl">
//               {score} / {exam.questions.length}
//             </p>
//           </div>
//         ) : (
//           <>
//             {exam.questions.map((q, i) => (
//               <div key={i} className="bg-white rounded-xl shadow-md p-6 mb-8">
//                 <h3 className="text-2xl font-semibold text-[#002855] mb-3">
//                   Q{i + 1}. {q.questionText}
//                 </h3>
//                 <div className="space-y-3">
//                   {q.options.map((opt, j) => (
//                     <label
//                       key={j}
//                       className="flex items-center space-x-3 text-gray-700"
//                     >
//                       <input
//                         type="radio"
//                         name={`q${i}`}
//                         checked={answers[i] === j}
//                         onChange={() => handleChange(i, j)}
//                         className="accent-[#002855] h-5 w-5"
//                       />
//                       <span>{opt}</span>
//                     </label>
//                   ))}
//                 </div>
//               </div>
//             ))}
//             <div className="text-center mt-6">
//               <button
//                 onClick={handleSubmit}
//                 className="px-8 py-3 bg-[#002855] text-white text-lg rounded hover:bg-[#001f47] transition"
//               >
//                 Submit
//               </button>
//             </div>
//           </>
//         )}
//       </div>
//     </div>
//   );
// }











// src/pages/GiveExam.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BiLoaderAlt } from 'react-icons/bi';

export default function GiveExam() {
  const { id: examId } = useParams();
  const navigate = useNavigate();

  const token = localStorage.getItem('token');  // 'Bearer <JWT>'

  const [exam, setExam] = useState(null);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [score, setScore] = useState(null);
  const [warningCount, setWarningCount] = useState(0);
  const [feedLoaded, setFeedLoaded] = useState(false);

  // === Restore saved progress ===
  useEffect(() => {
    if (!examId) return;
    (async () => {
      try {
        const res = await fetch(`/api/exams/${examId}/progress`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const prog = await res.json();
          if (prog.timeLeft != null) {
            setAnswers(prog.answers || {});
            setTimeLeft(prog.timeLeft);
          }
        }
      } catch (err) {
        console.error('Progress load error:', err);
      }
    })();
  }, [examId, token]);

  // === Fetch exam details ===
  useEffect(() => {
    if (!examId) return navigate(-1);
    (async () => {
      try {
        const res = await fetch(`/api/exams/${examId}/student`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error();
        const data = await res.json();

        if (data.alreadySubmitted) {
          setAlreadySubmitted(true);
          setSubmitted(true);
          setScore(data.score);
          setExam({ questions: data.questions || [], duration: 0 });
        } else {
          setExam(data);
        }
      } catch {
        navigate(-1);
      }
    })();
  }, [examId, navigate, token]);

  // === Initialize timer ===
  useEffect(() => {
    if (exam && timeLeft == null && !alreadySubmitted) {
      setTimeLeft(exam.duration * 60);
    }
  }, [exam, timeLeft, alreadySubmitted]);

  // === Countdown ===
  useEffect(() => {
    if (timeLeft == null || submitted) return;
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }
    const id = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(id);
  }, [timeLeft, submitted]);

  // === Anti-cheat tab switch ===
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden && !submitted && !alreadySubmitted) {
        setWarningCount(c => c + 1);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [submitted, alreadySubmitted]);

  useEffect(() => {
    if (warningCount === 1) {
      alert('Warning: Tab change detected! Next change auto-submits.');
    }
    if (warningCount >= 2 && !submitted && !alreadySubmitted) {
      alert('Tab changed again. Auto-submitting.');
      handleSubmit();
    }
  }, [warningCount, submitted, alreadySubmitted]);

  // === Save progress ===
  useEffect(() => {
    if (!submitted && exam && timeLeft != null) {
      (async () => {
        try {
          await fetch(`/api/exams/${examId}/progress`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ answers, timeLeft })
          });
        } catch (err) {
          console.error('Progress save error:', err);
        }
      })();
    }
  }, [answers, timeLeft, exam, submitted, examId, token]);

  // === Release camera on exit ===
  useEffect(() => {
    const release = () => {
      const url = 'http://192.168.10.17:5000/release_camera';
      if (navigator.sendBeacon) {
        navigator.sendBeacon(url);
      } else {
        fetch(url, { method: 'POST', mode: 'no-cors' });
      }
    };
    window.addEventListener('beforeunload', release);
    return () => {
      release();
      window.removeEventListener('beforeunload', release);
    };
  }, []);

  // === Polling for backend auto-submit ===
  useEffect(() => {
    if (submitted || alreadySubmitted) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/exams/${examId}/progress`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.status === 404) {
          clearInterval(interval);
          navigate(`/student/results/${examId}`);
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [examId, navigate, submitted, alreadySubmitted]);

  // === Handle select ===
  const handleChange = (qIdx, optIdx) => {
    setAnswers(a => ({ ...a, [qIdx]: optIdx }));
  };

  // === Handle submit ===
  async function handleSubmit() {
    if (submitted || alreadySubmitted) return;
    setSubmitted(true);

    const answersArr = (exam.questions || []).map((_, i) =>
      answers.hasOwnProperty(i) ? answers[i] : null
    );
    const rawScore = (exam.questions || []).reduce(
      (sum, q, i) => sum + (answersArr[i] === q.correctAnswerIndex ? 1 : 0),
      0
    );
    setScore(rawScore);

    try {
      await fetch(`/api/exams/${examId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ answers: answersArr, score: rawScore })
      });

      await fetch(`/api/exams/${examId}/progress`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error('Submit error:', err);
    }
  }

  const formatTime = secs => {
    const m = String(Math.floor(secs / 60)).padStart(2, '0');
    const s = String(secs % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  // === Updated Proctoring feed URL (without studentId) ===
  const streamUrl =
    `http://192.168.10.17:5000/video_feed`
    + `?exam=${examId}`
    + `&token=${encodeURIComponent(token)}`;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col lg:flex-row">
      {/* === Sidebar: Camera & Timer === */}
      <div className="w-full lg:w-80 bg-white p-6 flex flex-col sticky top-0 h-screen">
        <div
          className="bg-black w-full mb-4 rounded-lg shadow-lg overflow-hidden relative"
          style={{ paddingTop: '100%' }}
        >
          <img
            src={streamUrl}
            alt="Proctoring feed"
            className="absolute top-0 left-0 w-full h-full object-cover"
            onLoad={() => setFeedLoaded(true)}
            onError={() => console.error('Feed load error')}
          />
          {!feedLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-black">
              <BiLoaderAlt className="animate-spin text-white text-4xl" />
            </div>
          )}
        </div>

        {/* Timer */}
        <div className="text-4xl font-mono mb-2 text-center">
          {timeLeft != null ? formatTime(timeLeft) : '--:--'}
        </div>
        <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden mb-4">
          <div
            className="bg-[#002855] h-2 rounded-full transition-all duration-500"
            style={{
              width: exam
                ? `${((exam.duration * 60 - (timeLeft || 0)) / (exam.duration * 60)) * 100}%`
                : '0%'
            }}
          />
        </div>

        {alreadySubmitted && (
          <div className="text-center text-red-600 font-semibold">
            Aapne pehle hi exam submit kar diya hai.
          </div>
        )}
      </div>

      {/* === Main Content: Questions and Results === */}
      <div className="flex-1 p-6 lg:p-12 overflow-auto">
        {!exam ? (
          <div className="flex justify-center items-center h-full text-gray-500">
            Loading exam…
          </div>
        ) : submitted || alreadySubmitted ? (
          <div className="text-center">
            <h2 className="text-4xl font-bold text-[#002855] mb-4">
              Your Score
            </h2>
            <p className="text-2xl">
              {score} / {exam.questions.length}
            </p>
          </div>
        ) : (
          <>
            {exam.questions.map((q, i) => (
              <div key={i} className="bg-white rounded-xl shadow-md p-6 mb-8">
                <h3 className="text-2xl font-semibold text-[#002855] mb-3">
                  Q{i + 1}. {q.questionText}
                </h3>
                <div className="space-y-3">
                  {q.options.map((opt, j) => (
                    <label
                      key={j}
                      className="flex items-center space-x-3 text-gray-700"
                    >
                      <input
                        type="radio"
                        name={`q${i}`}
                        checked={answers[i] === j}
                        onChange={() => handleChange(i, j)}
                        className="accent-[#002855] h-5 w-5"
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
            <div className="text-center mt-6">
              <button
                onClick={handleSubmit}
                className="px-8 py-3 bg-[#002855] text-white text-lg rounded hover:bg-[#001f47] transition"
              >
                Submit
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
