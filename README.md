# IBM Healthcare Project

## Overview

This project is a healthcare management system designed to provide features such as patient registration, doctor and bed availability checking, and forecasting patient admissions. It includes both a backend built with Django and a frontend built with React.

---

## Prerequisites

Make sure you have the following installed before running the project:

1. **Python 3.9+** for the backend (Django API)
2. **Node.js** and **npm** for the frontend (React)
3. **Git** for version control
4. **Database**: SQLite is used by default, but you can configure PostgreSQL or MySQL.

---

## Setup Instructions

### 1. **Clone the Repository**

First, clone the repository to your local machine:

```
git clone https://github.com/krishspatel0605/IBM-HealthCare-Project.git
cd IBM-HealthCare-Project
```

## 2. Set Up the Backend (Django)

### a. Create a Virtual Environment
To avoid conflicts with other Python projects, it's best to create a virtual environment:

```
    python -m venv .venv
```

### b. activate the virtual Environment 
for windows 

``` 
.venv\Scripts\activate
```
for macOS/linux 

``` 
source .venv/bin/activate
```
### c. Install Dependencies
Once the virtual environment is activated, install the required packages:

``` 
pip install -r healthcare_app_backend/requirements.txt
```
### d. Run Migrations
Make sure your database is set up with the required tables:

``` 
python manage.py migrate
```
### e. Run the Backend Server
To start the backend server, run:

``` 
python manage.py runserver
```
### API will be running at http://127.0.0.1:8000/.

### 3. Set Up the Frontend (React)
a. Navigate to the Frontend Directory

``` 
cd healthcare-app_frontend
```

###b. Install Dependencies
Use npm to install the necessary packages for the frontend:

``` 
npm install
```
### c. Start the Frontend Server
To start the React development server, run:

```
npm start
```

This will open the frontend application in your default browser, usually at http://localhost:3000/.
