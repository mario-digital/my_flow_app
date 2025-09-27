## Project Evaluation Rubric

This rubric outlines the scoring for the TODO application project, totaling 100 points. Additionally, **Stretch Goals** offer an opportunity for bonus points, IF you've hit all Required Features.

---

### I. Required Features (MVP) - 50 Points
This section evaluates the completion of all core user stories, which constitute the Minimum Viable Product (MVP). Which will be evaluated through your recorded demo.

* **User Management (15 points)**: All core functionality related to user signup, login, and logout is working correctly and securely.
    * `15 points`: All user management features are fully functional.
    * `10 points`: Missing or non-functional aspects of user management.
    * `0 points`: No user management implemented.
* **Task Management (25 points)**: The application can create, read, update, and delete tasks. Required task fields (title, description, priority, deadline) are handled correctly.
    * `25 points`: All task CRUD operations are fully functional, including persistence of all required fields.
    * `15 points`: Key task operations (e.g., update or delete) are missing or buggy.
    * `0 points`: Task management is not implemented or is completely non-functional.
* **Labeling System (10 points)**: Users can create and assign labels to tasks, and the system correctly persists this information. There should be some predefined ones available for a user.
    * `10 points`: Label creation and assignment are fully functional.
    * `5 points`: Labeling system is partially implemented or has significant bugs.
    * `0 points`: Labeling functionality is not implemented.

---

### II. Technical Implementation & Structure - 25 Points
This section assesses the correct implementation of the technology stack and adherence to best practices.

* **Backend & Database (10 points)**: A FastAPI RESTful API correctly handles data, and all information is persisted in a MongoDB database.
* **Frontend & UI (10 points)**: A Next.js frontend correctly consumes the backend API and uses **one** of the specified UI libraries for component styling.
* **File Structure & Organization (5 points)**: The project's file structure for both the frontend and backend follows the provided examples and is logically organized.

---

### III. Git & GitHub Workflow - 15 Points
This section evaluates your version control and collaboration process, which is a critical professional skill.

* **Repository & `README.md` (5 points)**: A public GitHub repository was submitted on Day 1, and the `README.md` file is complete with a project description and setup instructions.
* **Commit History (10 points)**: There is evidence of daily commits with clear, descriptive commit messages, demonstrating consistent progress throughout the project.

---

### IV. Code Quality & Best Practices - 10 Points
This section looks at the overall quality and maintainability of your code.

* **Code Readability (5 points)**: Code is well-formatted, uses meaningful variable names, and is easy for others to read and understand.
* **Modularity & Efficiency (5 points)**: The codebase is broken down into logical, reusable modules, and there are no major performance bottlenecks.

---

### ⭐ Bonus Points (Stretch Goals) - Up to 10 Points
If and only if you've completed the required features will bonus points be awarded for stretch goals. Each successfully implemented stretch goal will earn bonus points, which can be applied toward the final score.

* **Task Filtering by Label (2.5 points)**: A functional filtering system based on labels.
* **User Profile Management (2.5 points)**: Users can view and edit their profile details.
* **Responsive Design (2.5 points)**: The application's layout adapts correctly to different screen sizes.
* **Comprehensive Error Handling (2.5 points)**: The application provides clear and helpful error messages to the user.