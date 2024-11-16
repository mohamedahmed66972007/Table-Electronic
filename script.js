
let pendingLessons = JSON.parse(localStorage.getItem('pendingLessons')) || [];
let materials = JSON.parse(localStorage.getItem('materials')) || [];
let countdownInterval;
let countdownEndTime;

document.addEventListener("DOMContentLoaded", initialize);

function initialize() {
    loadMaterials();
    renderTable();
    checkForActiveCountdown();
    updateClock();
    setInterval(updateClock, 1000);
}

function loadMaterials() {
    const savedMaterials = localStorage.getItem('materials');
    const savedPendingLessons = localStorage.getItem('pendingLessons');
    if (savedMaterials) materials = JSON.parse(savedMaterials);
    if (savedPendingLessons) pendingLessons = JSON.parse(savedPendingLessons);
}

function saveMaterials() {
    localStorage.setItem('materials', JSON.stringify(materials));
    localStorage.setItem('pendingLessons', JSON.stringify(pendingLessons));
}

function startCountdown(duration, material) {
    countdownEndTime = new Date(Date.now() + duration * 60 * 1000);
    localStorage.setItem('countdownEndTime', countdownEndTime.toISOString());
    localStorage.setItem('activeMaterial', JSON.stringify(material));
    document.getElementById('currentMaterial').textContent = `وقت دراسة ${material.name}`;
    updateCountdownDisplay();
    countdownInterval = setInterval(updateCountdownDisplay, 1000);
}

function finishCountdown(isManual = false) {
    clearInterval(countdownInterval);
    const activeMaterial = JSON.parse(localStorage.getItem('activeMaterial'));

    if (activeMaterial && !isManual) {
        activeMaterial.lessons.forEach(lesson => {
            if (!lesson.isCompleted) {
                pendingLessons.push({
                    material: activeMaterial.name,
                    lesson: lesson.lessonName,
                    date: new Date().toLocaleDateString('en-US')
                });
            }
        });
        saveMaterials();
        showAlert("انتهى الوقت وتم نقل الدروس غير المكتملة إلى المؤجلة.");
        
        // حذف المادة التي كان يعمل من أجلها المؤقت
    }

    // إعادة تحميل الصفحة
    location.reload();

    // إزالة المؤقت
    localStorage.removeItem('countdownEndTime');
    localStorage.removeItem('activeMaterial');
    document.getElementById('currentMaterial').textContent = "";
    document.getElementById('timer').textContent = "";
}

function updateCountdownDisplay() {
    const endTime = new Date(localStorage.getItem('countdownEndTime'));
    const timeLeft = Math.max(0, Math.floor((endTime - new Date()) / 1000));

    if (timeLeft <= 0) {
        finishCountdown();
    } else {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        document.getElementById('timer').textContent = `المتبقي: ${minutes} دقيقة ${seconds} ثانية`;
    }
}

function checkForActiveCountdown() {
    const endTime = localStorage.getItem('countdownEndTime');
    const activeMaterial = JSON.parse(localStorage.getItem('activeMaterial'));

    if (endTime && activeMaterial) {
        const timeLeft = Math.max(0, Math.floor((new Date(endTime) - new Date()) / 1000));
        if (timeLeft > 0) {
            startCountdown(timeLeft / 60, activeMaterial);
        } else {
            finishCountdown();
        }
    }
}

function completeMaterial() {
    finishCountdown(true);
    showAlert("تم إنهاء المادة بنجاح دون نقل الدروس إلى المؤجلة.");
}


function toggleLessonComplete(materialIndex, lessonIndex) {
    const lesson = materials[materialIndex].lessons[lessonIndex];
    lesson.isCompleted = !lesson.isCompleted;

    // تحقق من إذا كانت جميع الدروس مكتملة
    const allLessonsCompleted = materials[materialIndex].lessons.every(l => l.isCompleted);

    if (allLessonsCompleted) {
        // إذا كانت جميع الدروس مكتملة، احذف المؤقت
        clearActiveTimer();
        showAlert("تم إكتمال جميع الدروس");
        materials.splice(materialIndex, 1);
        location.reload();
    }

    saveMaterials();
    renderTable();
}

document.addEventListener("DOMContentLoaded", () => {
    setInterval(updateClock, 1000);
    updateClock();
    renderTable();
    checkForActiveCountdown();
    setInterval(checkAndStoreIncompleteLessons, 1000);
});



function checkAndStoreIncompleteLessons() {
    pendingLessons = pendingLessons.filter(pending => {
        const materialIndex = materials.findIndex(material => material.name === pending.material);
        if (materialIndex !== -1) {
            const lessonIndex = materials[materialIndex].lessons.findIndex(lesson => lesson.lessonName === pending.lesson && lesson.isCompleted);
            return lessonIndex === -1; 
        }
        return true; 
    });

    saveMaterials(); 
    renderPendingLessonsTable(); 
}

setInterval(checkCompletedLessons, 1000);






function markLessonComplete(lessonIndex) {
    const activeMaterial = JSON.parse(localStorage.getItem('activeMaterial'));
    if (activeMaterial) {
        activeMaterial.lessons[lessonIndex].isCompleted = !activeMaterial.lessons[lessonIndex].isCompleted;
        localStorage.setItem('activeMaterial', JSON.stringify(activeMaterial));
    }
}

function storeDeferredLessons() {
    pendingLessons.forEach(pendingLesson => {
        // تخزين الدروس المؤجلة في مكان محدد لاستدعائها لاحقًا
        console.log("تم تخزين الدرس المؤجل:", pendingLesson);
    });
}

function clearActiveTimer() {
    clearInterval(countdownInterval);
    localStorage.removeItem('countdownEndTime');
    localStorage.removeItem('activeMaterial');
    localStorage.removeItem('remainingTime');
}


function deleteMaterialByName(materialName) {
    // حذف المادة من الجدول الأساسي
    materials = materials.filter(material => material.name !== materialName);
    
    // حذف أي دروس مؤجلة مرتبطة بهذه المادة
    pendingLessons = pendingLessons.filter(pending => pending.material !== materialName);
    
    // حذف المؤقت إذا كان نشطًا
    const activeMaterial = JSON.parse(localStorage.getItem('activeMaterial'));
    if (activeMaterial && activeMaterial.name === materialName) {
        clearActiveTimer(); // حذف المؤقت
    }

    // حفظ التعديلات في localStorage
    saveMaterials();
    
    // إعادة عرض الجداول
    renderTable();
    updatePendingLessonsTable();
}

function completePendingLesson(index) {
    const pendingLesson = pendingLessons[index];
    // إزالة الدرس المؤجل
    pendingLessons.splice(index, 1); // إزالة الدرس المؤجل
    saveMaterials();
    updatePendingLessonsTable();

    // حذف الدرس من الجدول الأساسي إذا كان موجودًا
    const materialIndex = materials.findIndex(material => material.name === pendingLesson.material);
    if (materialIndex !== -1) {
        const lessonIndex = materials[materialIndex].lessons.findIndex(lesson => lesson.lessonName === pendingLesson.lesson);
        if (lessonIndex !== -1) {
            materials[materialIndex].lessons.splice(lessonIndex, 1); // حذف الدرس من المادة
            // إذا كانت جميع الدروس مكتملة، احذف المادة
            if (materials[materialIndex].lessons.length === 0) {
                materials.splice(materialIndex, 1);
                saveMaterials();
                renderTable();
                showAlert("تم الانتهاء من جميع الدروس، وتم حذف المادة.");
            } else {
                saveMaterials();
                renderTable();
            }
        }
    }
}


window.onload = function() {
    const countdownEndTime = localStorage.getItem('countdownEndTime');
    const remainingTime = localStorage.getItem('remainingTime');

    if (countdownEndTime && remainingTime) {
        const currentTime = new Date().getTime();
        if (currentTime >= countdownEndTime) {
            finishCountdown(); 
        } else {
            startTimer(remainingTime); 
        }
    }
};

function renderPendingLessonsTable() {
    const pendingTableBody = document.getElementById("pendingTable").getElementsByTagName("tbody")[0];
    pendingTableBody.innerHTML = '';

    if (pendingLessons.length === 0) {
        document.getElementById('pendingLessons').style.display = 'none';
        return; 
    }

    pendingLessons.forEach((pendingLesson, index) => {
        const row = pendingTableBody.insertRow();
        const cell1 = row.insertCell(0);
        const cell2 = row.insertCell(1);
        const cell3 = row.insertCell(2);
        const cell4 = row.insertCell(3);

        cell1.textContent = pendingLesson.material;
        cell2.textContent = pendingLesson.lesson;
        cell3.textContent = pendingLesson.date;

        const completeButton = document.createElement('button');
        completeButton.textContent = 'إتمام';
        completeButton.onclick = () => {
            completePendingLesson(index);
        };
        cell4.appendChild(completeButton);
    });

    document.getElementById('pendingLessons').style.display = 'block';
}


function updatePendingLessonsTable() {
    const pendingTableBody = document.getElementById("pendingTable").getElementsByTagName("tbody")[0];
    pendingTableBody.innerHTML = '';

    if (pendingLessons.length === 0) {
        document.getElementById('pendingLessons').style.display = 'none';
        return;
    }

    pendingLessons.forEach((pendingLesson, index) => {
        const row = pendingTableBody.insertRow();
        row.innerHTML = `
            <td>${pendingLesson.material}</td>
            <td>${pendingLesson.lesson}</td>
            <td>${pendingLesson.date}</td>
            <td>
                <button onclick="completePendingLesson(${index})">إتمام</button>
            </td>
        `;
    });

    document.getElementById('pendingLessons').style.display = 'block';
}



function openModal(question, callback, showInput = true, isYesNo = false) {
    document.getElementById('modalTitle').textContent = question;
    const modalInput = document.getElementById('modalInput');
    modalInput.style.display = showInput ? 'block' : 'none';
    modalInput.value = '';

    const confirmButton = document.getElementById('modalConfirmButton');
    const cancelButton = document.getElementById('modalCancelButton');
    confirmButton.style.display = isYesNo ? 'none' : 'inline-block';
    cancelButton.style.display = isYesNo ? 'none' : 'inline-block';

    const existingButtons = document.querySelector('.button-group.dynamic-buttons');
    if (existingButtons) existingButtons.remove();

    if (isYesNo) {
        const dynamicButtons = document.createElement('div');
        dynamicButtons.className = 'button-group dynamic-buttons';

        const yesButton = document.createElement('button');
        yesButton.textContent = 'نعم';
        yesButton.onclick = () => {
            callback(true);
        };

        const noButton = document.createElement('button');
        noButton.textContent = 'لا';
        noButton.onclick = () => {
            callback(false);
        };

        dynamicButtons.appendChild(yesButton);
        dynamicButtons.appendChild(noButton);
        document.getElementById('floatingModal').appendChild(dynamicButtons);
    } else {
        confirmButton.onclick = () => {
            const answer = modalInput.value.trim();
            if (showInput && !answer) {
                showAlert("يرجى إدخال اسم المادة."); // استخدام showAlert هنا
            } else {
                callback(answer);
            }
        };
    }

    cancelButton.onclick = () => {
        closeModal();
    };

    document.getElementById('overlay').style.display = 'block';
    document.getElementById('floatingModal').style.display = 'block';
}

function closeModal() {
    document.getElementById('overlay').style.display = 'none';
    document.getElementById('floatingModal').style.display = 'none';
    const existingButtons = document.querySelector('.button-group.dynamic-buttons');
    if (existingButtons) existingButtons.remove();
}

function addNewMaterial() {
    openModal("أدخل اسم المادة:", (materialName) => {
        if (materialName) {
            const material = { name: materialName, lessons: [], rewardTime: 0 };
            setStudyTime(material);
        } else {
            alert("اسم المادة مطلوب.");
        }
    });
}

function setStudyTime(material) {
    openModal("كم عدد الدقائق لمذاكرة المادة؟", (studyDuration) => {
        if (studyDuration) {
            material.studyDuration = parseInt(studyDuration) || 0;
            setRewardTime(material);
        } else {
            alert("يرجى إدخال عدد دقائق صحيح.");
        }
    });
}

function setRewardTime(material) {
    openModal("كم عدد دقائق المكافأة؟", (rewardTime) => {
        if (rewardTime) {
            material.rewardTime = parseInt(rewardTime) || 0;
            addLesson(material);
        } else {
            alert("يرجى إدخال عدد دقائق صحيح.");
        }
    });
}

function addLesson(material) {
    openModal("أدخل اسم الدرس:", (lessonName) => {
        if (lessonName) {
            material.lessons.push({
                lessonName: lessonName,
                isCompleted: false
            });
            askForMoreLessons(material);
        } else {
            alert("اسم الدرس مطلوب.");
        }
    });
}

function askForMoreLessons(material) {
    openModal("هل تريد إضافة درس آخر للمادة؟", (response) => {
        if (response) {
            addLesson(material); 
        } else {
            materials.push(material);
            askForMoreMaterials();
        }
    }, false, true); 
}

function askForMoreMaterials() {
    openModal("هل تريد إضافة مادة جديدة؟", (response) => {
        if (response) {
            addNewMaterial();
        } else {
            closeModal(); 
            renderTable(); // فقط استدعاء renderTable بدون إعادة تحميل الصفحة
        }
    }, false, true); 
}

function checkCompletedLessons() {
    materials.forEach((material, index) => {
        const allLessonsCompleted = material.lessons.every(lesson => lesson.isCompleted);
        if (allLessonsCompleted) {
            finishCountdown();
            showAlert(`تم إكمال جميع الدروس للمادة ${material.name}.`);
            materials.splice(index, 1);
            saveMaterials();
            renderTable();
            clearActiveTimer(); 
            location.reload(); 
        }
    });
}

function renderTable() {
    const tableBody = document
      .getElementById("lessonTable")
      .getElementsByTagName("tbody")[0];
    tableBody.innerHTML = '';

    if (materials.length === 0) {
        document.getElementById('lessonTable').style.display = 'none';
        document.getElementById('resetButton').style.display = 'none';
        return;
    }

    // إظهار زر إعادة تعيين الجدول عند وجود مواد
    document.getElementById('resetButton').style.display = 'block';

    materials.forEach((material, index) => {
        const row  = tableBody.insertRow();
        const cell1 = row.insertCell(0);
        const cell2 = row.insertCell(1);
        const cell3 = row.insertCell(2);
        const cell4 = row.insertCell(3);
        const cell5 = row.insertCell(4);
        cell1.innerHTML = `
           <div>
              ${material.name}
              <button style="font-size: 12px; padding: 5px 10px; margin-top: 5px;" 
                  onclick="editMaterial(${index})">تعديل</button>
           </div>
        `;

        cell2.innerHTML = material.lessons.map((lesson, i) => `
            <div>${lesson.lessonName} 
                        <input type="checkbox" 
                       ${lesson.isCompleted ? 'checked' : ''} 
                       onchange="toggleLessonComplete(${index}, ${i})" />
            </div>
        `).join('');

        cell3.innerHTML = `${material.studyDuration} دقيقة`;
        cell4.innerHTML = `${material.rewardTime} دقيقة`;

        const startButton = document.createElement('button');
        startButton.textContent = 'ابدأ';
        startButton.onclick = () => {
            startCountdown(material.studyDuration, material);
            material.started = true;
            startButton.style.display = 'none';
            saveMaterials();
        };
        if (material.started) startButton.style.display = 'none';
        cell5.appendChild(startButton);
    });

    document.getElementById('lessonTable').style.display = 'block';
}


function editMaterial(index) {
    const material = materials[index];

// تعديل اسم المادة
    const newName = prompt("أدخل اسم المادة الجديد:", material.name);
    if (newName) 
        material.name = newName;

// تعديل عدد الدقائق
    const newDuration = prompt("أدخل عدد الدقائق الجديد:", material.studyDuration);
    if (newDuration) 
        material.studyDuration = parseInt(newDuration);

// تعديل المكافأة
    const newReward = prompt("أدخل وقت المكافأة الجديد:", material.rewardTime);
    if (newReward) 
        material.rewardTime = parseInt(newReward);

// تعديل الدروس
    const newLessons = prompt(
        "أدخل الدروس الجديدة مفصولة بفاصلة:", 
        material.lessons.map(l => l.lessonName).join(',')
    );
    if (newLessons) {
        material.lessons = newLessons.split(',').map(lessonName => ({
            lessonName: lessonName.trim(),
            isCompleted: false
        }));
    }

    saveMaterials();
    renderTable();
}
function editMaterial(index) {
    const material = materials[index];

    openModal("أدخل اسم المادة الجديد:", (newName) => {
        if (newName) 
            material.name = newName;

        openModal("أدخل عدد الدقائق الجديد:", (newDuration) => {
            if (newDuration) 
                material.studyDuration = parseInt(newDuration);

            openModal("أدخل وقت المكافأة الجديد:", (newReward) => {
                if (newReward) 
                    material.rewardTime = parseInt(newReward);

                openModal("أدخل الدروس الجديدة مفصولة بفاصلة:", 
                    (newLessons) => {
                        if (newLessons) {
                            material.lessons = newLessons.split(',').map(lessonName => ({
                                lessonName: lessonName.trim(),
                                isCompleted: false
                            }));
                        }

                        saveMaterials();
                        renderTable();
                        closeModal();
                    });
            });
        });
    });
}


function showPendingLessons() {
    const pendingTableBody = document.getElementById("pendingTable").getElementsByTagName("tbody")[0];
    pendingTableBody.innerHTML = '';

    if (pendingLessons.length === 0) {
        showAlert("لا توجد دروس مؤجلة.");
        document.getElementById('pendingLessons').style.display = 'none';
        return; 
    }
    pendingLessons.forEach((pendingLesson, index) => {
        const row = pendingTableBody.insertRow();
        const cell1 = row.insertCell(0);
        const cell2 = row.insertCell(1);
        const cell3 = row.insertCell(2);
        const cell4 = row.insertCell(3);

        cell1.textContent = pendingLesson.material;
        cell2.textContent = pendingLesson.lesson;
        cell3.textContent = pendingLesson.date;

        const completeButton = document.createElement('button');
        completeButton.textContent = 'إتمام';
        completeButton.onclick = () => {
            completePendingLesson(index);
            renderPendingLessonsTable();
        };
        cell4.appendChild(completeButton);
    });

    document.getElementById('pendingLessons').style.display = 'block';
}

function resetTable() {
    materials = [];
    pendingLessons = [];
    localStorage.removeItem('materials');
    localStorage.removeItem('pendingLessons');
    localStorage.removeItem('countdownEndTime');
    localStorage.removeItem('remainingTime');
    localStorage.removeItem('activeMaterial');
    document.getElementById('currentMaterial').textContent = "";
    document.getElementById('timer').textContent = "";
    renderTable();
    document.getElementById('pendingLessons').style.display = 'none';
    showAlert("تمت إعادة تعيين الجدول.");
}

function showAlert(message) {
    const alertBox = document.getElementById('alertBox');
    alertBox.textContent = message;
    alertBox.style.display = 'block';
    alertBox.style.opacity = 1; // اجعلها مرئية
    alertBox.style.transition = 'opacity 0.5s'; // تأثير الانتقال

    // إخفاء مربع التنبيه بعد 3 ثواني
    setTimeout(() => {
        alertBox.style.opacity = 0; // اجعلها غير مرئية
        setTimeout(() => {
            alertBox.style.display = 'none'; // إخفاء العنصر بعد الانتهاء من التلاشي
        }, 500); // انتظر حتى ينتهي تأثير التلاشي
    }, 3000);
}

function updateClock() {
    const now = new Date();
    const options = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };
    document.getElementById('digitalClock').textContent = now.toLocaleTimeString('en-US', options);
}
