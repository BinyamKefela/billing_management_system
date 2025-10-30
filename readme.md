# Billing Management System

A powerful and extensible Billing Management System backend built with Django, Celery, redis, and Docker.  
This system allows **Billers** to manage their **Customers**, generate **Bills**, record **Payments**, and send **Notifications** for overdue or upcoming bills — all with background task automation via **Celery** and **Redis**.

---

## Features

**User Roles**
- **Super Admin** – full system control  
- **Biller** – manages customers, bills, and payments  
- **Customer** – views bills, receives reminders, and pays invoices  

**Billing & Payments**
- Create bills with automatic overdue detection  
- Record payments using multiple methods  
- Automatically update bill status (`Pending`, `Paid`, `Overdue`)  

**Notifications**
- Email-based overdue, payment, and reminder notifications  
- Background task management with **Celery + Redis**  

**System Monitoring**
- Celery task monitoring via **Flower Dashboard** at `:5555`  

**Audit Logging**
- Complete history of changes tracked with `django-auditlog`  

**Dockerized Setup**
- Simple local setup using **Docker Compose**

---

##  Quick Setup with Docker

###  Prerequisites

Before starting, ensure you have:
- **Docker Desktop** (for Windows/Mac)  
  or  
- **Docker & Docker Compose** (for Linux)

Check installation:
```bash
docker --version
docker-compose --version
 Getting Started
Clone the Repository

bash
Copy code
git clone https://github.com/BinyamKefela/billing_management_system.git
cd billing_management_system
Create a .env File

Inside your project root, create a .env file and add the following environment variables:


# ==========================
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=binyamkefela196@gmail.com
EMAIL_HOST_PASSWORD=oqsdhiuueibmmqfq
EMAIL_SUBJECT_PREFIX=KACHA-BILLING-MANAGEMENT
DEFAULT_FROM_EMAIL=Kacha Billing Management <noreply@example.com>

# SITE CONFIGURATION
SITE_URL=http://192.168.0.178/
CANCEL_URL=https://example.com
SUCCESS_URL=https://astedadervpms.com
NOTIFY_URL=https://parking.astedaderpms.com/api/payment_complete
EMAIL=test@gmail.com
BANK=AWINETAA
COMPANY_EMAIL=kacha@gmail.com

#  DATABASE CONFIGURATION
POSTGRES_DB=bill
POSTGRES_USER=binyam
POSTGRES_PASSWORD=binyam
DB_HOST=db
DB_PORT=5432

Build and Run Containers

bash
Copy code
docker-compose up --build
This will:

Build the Django app

Launch PostgreSQL

Start Redis and Celery workers

Expose:

Django API: http://localhost:8808

Celery Flower: http://localhost:5555

Create Super Admin
Once containers are up, create a superuser:

bash
Copy code
docker exec -it django_app_billing python manage.py createsuperuser
Access the admin panel at:
- http://localhost:8808/admin

- Background Tasks (Celery + Redis)
Celery handles background jobs such as:

Sending email notifications

Checking overdue bills

Processing queued tasks

- Components
Service	Description
Celery Worker	Executes asynchronous tasks
Redis	Acts as the message broker
Celery Flower	Web UI to monitor tasks at http://localhost:5555

To verify workers:

bash
Copy code
docker ps
To check Celery logs:

Custom user model with role flags:

is_biller

is_customer

is_superuser

- Biller
Represents a business entity issuing bills.

- CustomerBiller
Links a customer account to a specific biller.

- Bill
Tracks invoices:

Bill number

Amount

Due date

Status (Pending / Paid / Overdue)

- Payment
Supports multiple payment methods:

Cash

Bank Transfer

Mobile Money

Card

- PaymentBill
Maps payments to bills, enabling partial payments.

- Notification
Automatically sends reminders and payment confirmations via Celery.

- Useful Docker Commands
Command	Description
docker-compose up -d	- Start all containers in background
docker-compose down	    - Stop and remove containers
docker ps	List active containers
docker exec -it django_app_billing    - bash	Access app container shell
docker logs -f celery_worker	    - View Celery task logs
docker-compose restart	    - Restart all containers

API Documentation

bash
Copy code
http://localhost:8808/swagger/
Or Redoc:


- Author
Binyam Kefela
📧 binyamkefela196@gmail.com
🌐 https://github.com/BinyamKefela

🌟 Thank you! from Binyam Kefela ⭐ on GitHub!








