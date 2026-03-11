const { getDb } = require('../config/db');

// Add a new subject
exports.addSubject = async (req, res) => {
    try {
        const { subject_name, exam_date, difficulty } = req.body;
        const userId = req.user.id;

        if (!subject_name || !exam_date || !difficulty) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        const db = await getDb();
        const result = await db.run(
            'INSERT INTO Subjects (user_id, subject_name, exam_date, difficulty) VALUES (?, ?, ?, ?)',
            [userId, subject_name, exam_date, difficulty]
        );

        res.status(201).json({ message: 'Subject added successfully!', id: result.lastID });
    } catch (error) {
        console.error('Error adding subject:', error);
        res.status(500).json({ message: 'Server error while adding subject.' });
    }
};

// Get all subjects for a user
exports.getSubjects = async (req, res) => {
    try {
        const userId = req.user.id;
        const db = await getDb();
        const subjects = await db.all('SELECT * FROM Subjects WHERE user_id = ? ORDER BY exam_date ASC', [userId]);
        res.json(subjects);
    } catch (error) {
        console.error('Error getting subjects:', error);
        res.status(500).json({ message: 'Server error while fetching subjects.' });
    }
};

// Generate study plan
exports.generateStudyPlan = async (req, res) => {
    try {
        const { daily_hours } = req.body;
        const userId = req.user.id;

        if (!daily_hours || isNaN(daily_hours) || daily_hours <= 0) {
            return res.status(400).json({ message: 'Please provide valid daily study hours.' });
        }

        const db = await getDb();
        const subjects = await db.all('SELECT * FROM Subjects WHERE user_id = ?', [userId]);

        if (subjects.length === 0) {
            return res.status(400).json({ message: 'No subjects found. Please add subjects first.' });
        }

        await db.run('DELETE FROM Study_Plan WHERE user_id = ?', [userId]);

        const today = new Date();
        const planToInsert = [];

        for (const subject of subjects) {
            const examDate = new Date(subject.exam_date);
            const daysRemaining = Math.ceil((examDate - today) / (1000 * 60 * 60 * 24));
            
            if (daysRemaining <= 0) continue; 

            let hoursNeededPerDay = 1;
            if (subject.difficulty === 'Hard') hoursNeededPerDay = 2;
            else if (subject.difficulty === 'Medium') hoursNeededPerDay = 1;

            for (let i = 0; i <= daysRemaining - 1; i++) {
                const targetDate = new Date(today);
                targetDate.setDate(targetDate.getDate() + i);
                const dateStr = targetDate.toISOString().split('T')[0];
                const task = `Study ${subject.subject_name} for roughly ${hoursNeededPerDay} hrs (Level: ${subject.difficulty})`;

                planToInsert.push([userId, subject.subject_name, dateStr, task, 'Pending']);
            }
        }

        if (planToInsert.length > 0) {
            const insertQuery = 'INSERT INTO Study_Plan (user_id, subject_name, study_date, task, status) VALUES (?, ?, ?, ?, ?)';
            const stmt = await db.prepare(insertQuery);
            for (const row of planToInsert) {
                await stmt.run(row);
            }
            await stmt.finalize();
        }

        res.json({ message: 'Study plan generated successfully!', plan_count: planToInsert.length });
    } catch (error) {
        console.error('Error generating plan:', error);
        res.status(500).json({ message: 'Server error while generating plan.' });
    }
};

// Get study plan
exports.getStudyPlan = async (req, res) => {
    try {
        const userId = req.user.id;
        const db = await getDb();
        const plan = await db.all('SELECT * FROM Study_Plan WHERE user_id = ? ORDER BY study_date ASC', [userId]);
        res.json(plan);
    } catch (error) {
        console.error('Error getting plan:', error);
        res.status(500).json({ message: 'Server error while fetching plan.' });
    }
};

// Complete task
exports.completeTask = async (req, res) => {
    try {
        const { taskId } = req.params;
        const userId = req.user.id;

        const db = await getDb();
        const result = await db.run(
            'UPDATE Study_Plan SET status = "Completed" WHERE id = ? AND user_id = ?',
            [taskId, userId]
        );

        if (result.changes === 0) {
            return res.status(404).json({ message: 'Task not found or unauthorized.' });
        }

        res.json({ message: 'Task marked as completed.' });
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({ message: 'Server error while updating task.' });
    }
};
