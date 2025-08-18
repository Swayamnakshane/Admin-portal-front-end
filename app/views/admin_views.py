from flask import request, jsonify
from flask.views import MethodView
from ..models import Admin, Employe, ist_now,  Task,Meeting, DocumentUpload , Timesheet, TimeSlot, TrainingAndLearning,RecordingSection
from flask_jwt_extended import create_access_token, create_refresh_token
from werkzeug.security import generate_password_hash
from datetime import datetime


class RegisterAdmin(MethodView):
    def post(self):
        data = request.get_json()
        name = data.get('name')
        email = data.get('email')
        password = data.get('password')
        mobile = data.get('mobile')
        is_active = data.get('is_active', True)

        if not all([name, email, password, mobile]):
            return jsonify({'error': 'Name, email, password, and mobile are required.'}), 400

        if Admin.objects(email=email).first():
            return jsonify({'error': 'Email already registered.'}), 409

        if Admin.objects(mobile=mobile).first():
            return jsonify({'error': 'Mobile already registered.'}), 409

        hashed_password = generate_password_hash(password)

        new_admin = Admin(
            name=name,
            email=email,
            password=hashed_password,
            mobile=mobile,
            is_active=is_active
        )
        new_admin.save()

        return jsonify({'message': 'Admin registered successfully.'}), 201


from flask_jwt_extended import create_access_token, create_refresh_token
from werkzeug.security import check_password_hash


class AdminLoginAPI(MethodView):
    def post(self):
        data = request.get_json() or {}

        email = data.get('email')
        mobile = data.get('mobile')
        password = data.get('password')

        # Check for missing required fields
        if not password or (not email and not mobile):
            return jsonify({'message': 'Email or mobile and password are required'}), 400

        # Fetch admin based on email or mobile
        if email:
            admin = Admin.objects(email=email).first()
        else:
            admin = Admin.objects(mobile=mobile).first()

        if not admin:
            return jsonify({'message': 'Admin not found'}), 404

        # Check password
        if not check_password_hash(admin.password, password):
            return jsonify({'message': 'Invalid password'}), 401

        # Create tokens
        admin_id = str(admin.id)
        access_token = create_access_token(identity=admin_id)
        refresh_token = create_refresh_token(identity=admin_id)

        return jsonify({
            'message': 'Admin logged in successfully.',
            'name': admin.name,  # Use the actual instance's name
            'access_token': access_token,
            'refresh_token': refresh_token
        }), 200

from flask_jwt_extended import jwt_required, get_jwt_identity

class RefreshAPI(MethodView):
    @jwt_required(refresh=True)
    def post(self):
        current_user = get_jwt_identity()
        new_access_token = create_access_token(identity=current_user, expires_delta=timedelta(minutes=15))
        return jsonify({'access_token': new_access_token}), 200




import pandas as pd
from flask import request, jsonify
from flask.views import MethodView
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta, timezone


IST = timezone(timedelta(hours=5, minutes=30))
def ist_now(): return datetime.now(IST)




class UploadEmploye(MethodView):
    @jwt_required()
    def post(self):
        current_user_id = get_jwt_identity()

        # Verify admin
        try:
            admin = Admin.objects.get(id=current_user_id)
        except Admin.DoesNotExist:
            return jsonify({'error': 'Admin not found'}), 404

        if 'file' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400

        file = request.files['file']
        try:
            df = pd.read_excel(file)
        except Exception as e:
            return jsonify({'error': f'Invalid Excel file. {str(e)}'}), 400

        added = 0
        for _, row in df.iterrows():
            employee_id = row.get('employee_id')
            name = row.get('name')
            email = row.get('email')
            password = row.get('password')

            if not employee_id or not name or not email or not password:
                continue  # Skip incomplete rows

            if Employe.objects(email=email).first():
                continue  # Skip existing employees by email

            emp = Employe(
                employee_id=employee_id,
                name=name,
                email=email,
                password=password,
                is_verified=True,
                created_at=ist_now(),
                updated_at=ist_now()
            )
            emp.save()
            added += 1

        return jsonify({'message': f'{added} employees added successfully'}), 200

# ------------------------
class GetAllEmployees(MethodView):
    @jwt_required()
    def get(self):
        employees = Employe.objects(is_verified=True)
        employee_list = [
            {
                'employee_id': emp.employee_id,
                'name': emp.name,
                'email': emp.email,
                'created_at': emp.created_at.strftime("%d-%m-%Y %H:%M:%S"),
                'updated_at': emp.updated_at.strftime("%d-%m-%Y %H:%M:%S")
            }
            for emp in employees
        ]
        return jsonify(employee_list), 200


# ------------------------
# Get Specific Employee by ID
# ------------------------
class GetEmployee(MethodView):
    @jwt_required()
    def get(self, employee_id):
        employee = Employe.objects(employee_id=employee_id).first()
        if not employee:
            return jsonify({'error': f'Employee {employee_id} not found.'}), 404

        employee_data = {
            'employee_id': employee.employee_id,
            'name': employee.name,
            'email': employee.email,
            'created_at': employee.created_at.strftime("%d-%m-%Y %H:%M:%S"),
            'updated_at': employee.updated_at.strftime("%d-%m-%Y %H:%M:%S")
        }
        return jsonify(employee_data), 200



from collections import defaultdict


class UploadTask(MethodView):
    @jwt_required()
    def post(self):
        current_user_id = get_jwt_identity()

        try:
            admin = Admin.objects.get(id=current_user_id)
        except Admin.DoesNotExist:
            return jsonify({'error': 'Admin not found'}), 404

        if 'file' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400

        file = request.files['file']
        try:
            df = pd.read_excel(file)
        except Exception as e:
            return jsonify({'error': f'Invalid Excel file. {str(e)}'}), 400

        required_fields = {'task_id', 'employee_id', 'title', 'description', 'due_date'}
        if not required_fields.issubset(df.columns):
            return jsonify({'error': f'Missing required fields in Excel. Required: {list(required_fields)}'}), 400

        tasks_grouped = defaultdict(list)
        task_meta = {}

        for _, row in df.iterrows():
            task_id = str(row['task_id']).strip()
            employee_id = str(row['employee_id']).strip()

            try:
                employee = Employe.objects.get(employee_id=employee_id)
                tasks_grouped[task_id].append(employee)
            except Employe.DoesNotExist:
                continue

            if task_id not in task_meta:
                due_date = row.get('due_date')
                if isinstance(due_date, str):
                    due_date = datetime.strptime(due_date, "%d-%m-%Y")
                task_meta[task_id] = {
                    'title': str(row['title']).strip(),
                    'description': str(row['description']).strip(),
                    'due_date': due_date,
                }

        added = 0
        errors = []

        for task_id, employees in tasks_grouped.items():
            if Task.objects(task_id=task_id).first():
                errors.append(f"Task {task_id} already exists.")
                continue

            meta = task_meta[task_id]
            task = Task(
                task_id=task_id,
                title=meta['title'],
                description=meta['description'],
                project_id="",
                assigned_by=admin,
                assigned_to=employees,
                approval_status="Pending",
                status="Assigned",
                assigned_date=ist_now(),
                due_date=meta['due_date'],
                created_at=ist_now(),
                updated_at=ist_now()
            )
            task.save()
            added += 1

        return jsonify({
            'message': f'{added} tasks uploaded successfully.',
            'errors': errors
        }), 200


class UpdateTask(MethodView):
    @jwt_required()
    def put(self, task_id):
        current_user_id = get_jwt_identity()

        try:
            admin = Admin.objects.get(id=current_user_id)
        except Admin.DoesNotExist:
            return jsonify({'error': 'Admin not found'}), 404

        task = Task.objects(task_id=task_id).first()
        if not task:
            return jsonify({'error': f'Task {task_id} not found.'}), 404

        data = request.get_json()
        if not data:
            return jsonify({'error': 'No input data provided'}), 400

        allowed_fields = {'title', 'description', 'due_date', 'assigned_to', 'approval_status', 'status'}
        updates = {}

        for field in allowed_fields:
            if field in data:
                updates[field] = data[field]

        if 'due_date' in updates:
            try:
                updates['due_date'] = datetime.strptime(updates['due_date'], "%d-%m-%Y")
            except ValueError:
                return jsonify({'error': 'Invalid due_date format. Expected DD-MM-YYYY'}), 400

        if 'assigned_to' in updates:
            employee_ids = updates['assigned_to']
            if not isinstance(employee_ids, list):
                return jsonify({'error': 'assigned_to must be a list of employee IDs'}), 400
            employees = []
            for emp_id in employee_ids:
                try:
                    emp = Employe.objects.get(employee_id=emp_id)
                    employees.append(emp)
                except Employe.DoesNotExist:
                    return jsonify({'error': f'Employee {emp_id} not found'}), 400
            updates['assigned_to'] = employees

        for key, value in updates.items():
            setattr(task, key, value)

        task.updated_at = ist_now()
        task.save()

        return jsonify({'message': f'Task {task_id} updated successfully.'}), 200


class GetTask(MethodView):
    @jwt_required()
    def get(self, task_id):
        task = Task.objects(task_id=task_id).first()
        if not task:
            return jsonify({'error': f'Task {task_id} not found.'}), 404

        def employee_to_dict(emp):
            return {
                'employee_id': emp.employee_id,
                'name': emp.name,
                'email': emp.email
            }

        task_data = {
            'task_id': task.task_id,
            'title': task.title,
            'description': task.description,
            'project_id': task.project_id,
            'assigned_by': {
                'id': str(task.assigned_by.id),
                'name': task.assigned_by.name
            } if task.assigned_by else None,
            'assigned_to': [employee_to_dict(emp) for emp in task.assigned_to],
            'approval_status': task.approval_status,
            'status': task.status,
            'assigned_date': task.assigned_date.strftime("%d-%m-%Y") if task.assigned_date else None,
            'due_date': task.due_date.strftime("%d-%m-%Y") if task.due_date else None,
            'created_at': task.created_at.strftime("%d-%m-%Y %H:%M:%S") if task.created_at else None,
            'updated_at': task.updated_at.strftime("%d-%m-%Y %H:%M:%S") if task.updated_at else None,
        }

        return jsonify(task_data), 200
# ✅ Get All Tasks API (no filter for is_active)
class GetAllTasks(MethodView):
    @jwt_required()
    def get(self):
        tasks = Task.objects().order_by('-assigned_date')  # ← removed is_active filter
        task_list = []

        for task in tasks:
            task_data = {
                'task_id': task.task_id,
                'title': task.title,
                'description': task.description,
                'project_id': task.project_id,
                'assigned_by': {
                    'id': str(task.assigned_by.id),
                    'name': task.assigned_by.name
                } if task.assigned_by else None,
                'assigned_to': [emp.employee_id for emp in task.assigned_to],
                'approval_status': task.approval_status,
                'status': task.status,
                'assigned_date': task.assigned_date.strftime("%d-%m-%Y") if task.assigned_date else None,
                'due_date': task.due_date.strftime("%d-%m-%Y") if task.due_date else None,
                'created_at': task.created_at.strftime("%d-%m-%Y %H:%M:%S") if task.created_at else None,
                'updated_at': task.updated_at.strftime("%d-%m-%Y %H:%M:%S") if task.updated_at else None,
            }
            task_list.append(task_data)

        return jsonify(task_list), 200

class UpdateTaskApprovalStatus(MethodView):
    @jwt_required()
    def put(self, task_id):
        current_user_id = get_jwt_identity()

        # ✅ Verify admin
        try:
            admin = Admin.objects.get(id=current_user_id)
        except Admin.DoesNotExist:
            return jsonify({'error': 'Admin not found'}), 404

        # ✅ Fetch task
        task = Task.objects(task_id=task_id).first()
        if not task:
            return jsonify({'error': f'Task {task_id} not found.'}), 404

        # ✅ Get input data
        data = request.get_json()
        if not data or 'approval_status' not in data:
            return jsonify({'error': 'approval_status is required'}), 400

        new_status = data['approval_status'].strip().capitalize()

        # ✅ Only allow "Approved" or "Rejected"
        if new_status not in ["Approved", "Rejected"]:
            return jsonify({'error': 'Invalid approval_status. Allowed: Approved or Rejected'}), 400

        # ✅ Update task approval
        task.approval_status = new_status
        task.approval_date = ist_now()
        task.updated_at = ist_now()
        task.save()

        return jsonify({
            'message': f'Task {task_id} approval status updated to {new_status}.'
        }), 200


# # ✅ Create meeting for selected employees
# class CreateMeeting(MethodView):
#     @jwt_required()
#     def post(self):
#         current_user_id = get_jwt_identity()

#         admin = Admin.objects(id=current_user_id).first()
#         if not admin:
#             return jsonify({'error': 'Admin not found'}), 404

#         data = request.get_json() or {}
#         required_fields = {'employee_ids', 'meeting_type', 'title', 'date_time', 'link', 'agenda'}
#         if not required_fields.issubset(data.keys()):
#             return jsonify({'error': f'Missing required fields: {list(required_fields)}'}), 400

#         # Validate employees
#         employees = Employe.objects(employee_id__in=data['employee_ids'])
#         if not employees:
#             return jsonify({'error': 'No valid employees found'}), 404

#         try:
#             date_time = datetime.strptime(data['date_time'], "%d-%m-%Y %H:%M")
#         except ValueError:
#             return jsonify({'error': 'Invalid date_time format. Expected DD-MM-YYYY HH:MM'}), 400

#         meeting = Meeting(
#             meeting_id=str(uuid.uuid4()),
#             title=data['title'],
#             meeting_type=data['meeting_type'],
#             description=data.get('description'),
#             location=data.get('location'),
#             date_time=date_time,
#             duration_minutes=data.get('duration_minutes'),
#             link=data['link'],
#             agenda=data['agenda'],
#             notes=data.get('notes'),
#             status="Scheduled",
#             employees=list(employees),
#             created_by=admin
#         )
#         meeting.save()

#         return jsonify({'message': '✅ Meeting created successfully.', 'meeting_id': meeting.meeting_id}), 201


# ✅ Create meeting for all employees
# ✅ Create meeting for selected employees
# 📌 Common function to parse date
def parse_meeting_datetime(date_str):
    formats = ["%d-%m-%Y %H:%M", "%Y-%m-%d %H:%M"]
    for fmt in formats:
        try:
            return datetime.strptime(date_str, fmt)
        except ValueError:
            continue
    raise ValueError("Invalid date format. Use either DD-MM-YYYY HH:MM or YYYY-MM-DD HH:MM")


# 📌 Common meeting_type validator
VALID_MEETING_TYPES = ["Team Meeting", "Client Meeting", "One-on-One", "Training"]

def validate_meeting_type(meeting_type):
    if meeting_type not in VALID_MEETING_TYPES:
        raise ValueError(f"Invalid meeting_type. Must be one of {VALID_MEETING_TYPES}")


# ✅ Create meeting for selected employees
class CreateMeeting(MethodView):
    @jwt_required()
    def post(self):
        data = request.get_json()
        current_user_id = get_jwt_identity()

        admin = Admin.objects(id=current_user_id).first()
        if not admin:
            return jsonify({'error': 'Admin not found'}), 404

        required_fields = ['title', 'meeting_type', 'date_time', 'duration_minutes']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({'error': f'Missing required field: {field}'}), 400

        try:
            validate_meeting_type(data['meeting_type'])
        except ValueError as e:
            return jsonify({'error': str(e)}), 400

        try:
            date_time = parse_meeting_datetime(data['date_time'])
        except ValueError as e:
            return jsonify({'error': str(e)}), 400

        employees = []
        if data.get('employee_ids'):
            employees = list(Employe.objects(employee_id__in=data['employee_ids']))

        meeting = Meeting(
            meeting_id=str(uuid.uuid4()),
            title=data['title'],
            meeting_type=data['meeting_type'],
            description=data.get('description', ''),
            location=data.get('location', 'Virtual Meeting'),
            date_time=date_time,
            duration_minutes=int(data['duration_minutes']),
            link=data.get('link', ''),
            agenda=data.get('agenda', ''),
            notes=data.get('notes', ''),
            status='Scheduled',
            employees=employees,
            created_by=admin
        )
        meeting.save()

        return jsonify({
            'message': 'Meeting created successfully',
            'meeting_id': meeting.meeting_id
        }), 201


# ✅ Create meeting for all employees
class CreateMeetingForAll(MethodView):
    @jwt_required()
    def post(self):
        current_user_id = get_jwt_identity()
        admin = Admin.objects(id=current_user_id).first()
        if not admin:
            return jsonify({'error': 'Admin not found'}), 404

        data = request.get_json() or {}
        required_fields = {'meeting_type', 'title', 'date_time', 'link', 'agenda'}
        if not required_fields.issubset(data.keys()):
            return jsonify({'error': f'Missing required fields: {list(required_fields)}'}), 400

        try:
            validate_meeting_type(data['meeting_type'])
        except ValueError as e:
            return jsonify({'error': str(e)}), 400

        try:
            date_time = parse_meeting_datetime(data['date_time'])
        except ValueError as e:
            return jsonify({'error': str(e)}), 400

        employees = list(Employe.objects())
        if not employees:
            return jsonify({'error': 'No employees found'}), 404

        meeting = Meeting(
            meeting_id=str(uuid.uuid4()),
            title=data['title'],
            meeting_type=data['meeting_type'],
            description=data.get('description'),
            location=data.get('location'),
            date_time=date_time,
            duration_minutes=int(data.get('duration_minutes', 0)),
            link=data['link'],
            agenda=data['agenda'],
            notes=data.get('notes'),
            status="Scheduled",
            employees=employees,
            created_by=admin
        )
        meeting.save()

        return jsonify({
            'message': '✅ Meeting created for all employees.',
            'meeting_id': meeting.meeting_id
        }), 201


# ✅ Update meeting
class UpdateMeeting(MethodView):
    @jwt_required()
    def put(self, meeting_id):
        data = request.get_json() or {}

        try:
            meeting = Meeting.objects.get(meeting_id=meeting_id)
        except Meeting.DoesNotExist:
            return jsonify({"error": "Meeting not found"}), 404

        if "meeting_type" in data:
            try:
                validate_meeting_type(data['meeting_type'])
            except ValueError as e:
                return jsonify({'error': str(e)}), 400

        if "employee_ids" in data:
            try:
                employees = [Employe.objects.get(employee_id=eid) for eid in data["employee_ids"]]
                data["employees"] = employees
                del data["employee_ids"]
            except Employe.DoesNotExist:
                return jsonify({"error": "One or more employees not found"}), 400

        if "date_time" in data:
            try:
                data["date_time"] = parse_meeting_datetime(data['date_time'])
            except ValueError as e:
                return jsonify({'error': str(e)}), 400

        if "duration_minutes" in data:
            try:
                data["duration_minutes"] = int(data["duration_minutes"])
            except ValueError:
                return jsonify({"error": "duration_minutes must be an integer"}), 400

        meeting.update(**data, updated_at=datetime.now())
        meeting.reload()

        return jsonify({
            "message": "✅ Meeting updated successfully.",
            "meeting": format_meeting(meeting)
        }), 200


def format_meeting(meeting):
    return {
        "meeting_id": meeting.meeting_id,
        "title": meeting.title,
        "meeting_type": meeting.meeting_type,
        "description": meeting.description,
        "location": meeting.location,
        "date_time": meeting.date_time.strftime("%d-%m-%Y %H:%M"),  # Consistent format
        "duration_minutes": meeting.duration_minutes,
        "link": meeting.link,
        "agenda": meeting.agenda,
        "notes": meeting.notes,
        "status": meeting.status,
        "is_active": meeting.is_active,
        "employees": [str(emp.id) for emp in meeting.employees],
        "created_by": str(meeting.created_by.id),
        "created_at": meeting.created_at.strftime("%d-%m-%Y %H:%M"),  # Consistent format
        "updated_at": meeting.updated_at.strftime("%d-%m-%Y %H:%M"),  # Consistent format
    }




# ✅ Get meetings for a specific employee
class GetMeetingByEmployee(MethodView):
    @jwt_required()
    def get(self, employee_id):
        # Find the employee object first
        employee = Employe.objects(employee_id=employee_id).first()
        if not employee:
            return jsonify({"error": f"Employee {employee_id} not found."}), 404

        # Query meetings where the employee is in the employees list
        meetings = Meeting.objects(employees=employee, is_active=True).order_by('-date_time')

        output = [
            {
                "meeting_id": m.meeting_id,
                "title": m.title,
                "meeting_type": m.meeting_type,
                "date_time": m.date_time.strftime("%d-%m-%Y %H:%M"),
                "agenda": m.agenda,
                "link": m.link,
                "status": m.status
            }
            for m in meetings
        ]
        return jsonify({"meetings": output}), 200



# ✅ Get all meetings
class GetAllMeetings(MethodView):
    @jwt_required()
    def get(self):
        meetings = Meeting.objects(is_active=True).order_by('-date_time')
        result = [
            {
                "meeting_id": m.meeting_id,
                "title": m.title,
                "employee_ids": [emp.employee_id for emp in m.employees],
                "meeting_type": m.meeting_type,
                "date_time": m.date_time.strftime("%d-%m-%Y %H:%M"),
                "agenda": m.agenda,
                "link": m.link,
                "status": m.status,
            }
            for m in meetings
        ]
        return jsonify({"meetings": result}), 200

# ✅ Delete Meeting
class DeleteMeeting(MethodView):
    @jwt_required()
    def delete(self, meeting_id):
        current_user_id = get_jwt_identity()

        admin = Admin.objects(id=current_user_id).first()
        if not admin:
            return jsonify({'error': 'Admin not found'}), 404

        meeting = Meeting.objects(meeting_id=meeting_id).first()
        if not meeting:
            return jsonify({'error': f'Meeting {meeting_id} not found.'}), 404

        meeting.delete()  # Permanent delete in MongoEngine
        return jsonify({
            'message': f'Meeting {meeting_id} deleted successfully',
            'deleted': True
        }), 200

    def options(self, meeting_id):
        response = jsonify()
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'DELETE,OPTIONS')
        return response
from bson import ObjectId

class GetDocumentUpload(MethodView):
    @jwt_required()
    def get(self, employee_id):
        # Find all documents by employee_id
        documents = DocumentUpload.objects(employee_id=employee_id, is_active=True)

        if not documents:
            return jsonify({
                "message": f"No documents found for employee {employee_id}"
            }), 200   # ✅ Success response, just no docs

        # Return list of documents
        return jsonify([
            {
                'document_id': str(doc.id),
                'employee_id': doc.employee_id,
                'document_type': doc.document_type,
                'document_name': doc.document_name,
                'document_url': doc.document_url,
                'file_size_kb': doc.file_size_kb,
                'file_extension': doc.file_extension,
                'verification_status': doc.verification_status,
                'verification_notes': doc.verification_notes,
                'uploaded_at': doc.uploaded_at.strftime("%Y-%m-%d %H:%M:%S"),
            }
            for doc in documents
        ]), 200



        
import traceback
class UpdateStatusDocumentUpload(MethodView):
    @jwt_required()
    def put(self, document_id):
        current_user_id = get_jwt_identity()

        try:
            admin = Admin.objects.get(id=current_user_id)
        except Admin.DoesNotExist:
            return jsonify({'error': 'Admin not found'}), 404

        try:
            document = DocumentUpload.objects(id=document_id).first()
            if not document:
                return jsonify({'error': f'Document {document_id} not found.'}), 404

            data = request.get_json()
            new_status = data.get("verification_status")
            notes = data.get("verification_notes", "")

            if new_status not in ["Approved", "Rejected"]:
                return jsonify({'error': 'Invalid status. Must be "Approved" or "Rejected".'}), 400

            document.verification_status = new_status
            document.verification_notes = notes
            document.is_verified = True if new_status == "Approved" else False
            document.verified_by = admin
            document.verified_at = ist_now()
            document.save()

            return jsonify({
                'message': f'Document {document_id} has been {new_status.lower()} successfully.'
            }), 200

        except Exception as e:
            traceback.print_exc()
            return jsonify({
                'message': '❌ Failed to update document status.',
                'error': str(e)
            }), 500


class AdminViewSingleTimesheet(MethodView):
    @jwt_required()
    def get(self, timesheet_id):
        admin = Admin.objects(id=get_jwt_identity()).first()
        if not admin:
            return jsonify({"error": "Admin not found"}), 404

        timesheet = Timesheet.objects(id=timesheet_id).first()
        if not timesheet:
            return jsonify({"error": "Timesheet not found"}), 404

        timeslot_details = [
            {
                "start_time": slot.start_time.strftime("%H:%M"),
                "end_time": slot.end_time.strftime("%H:%M"),
                "description": slot.description
            }
            for slot in timesheet.time_slots
        ]

        return jsonify({
            "id": str(timesheet.id),
            "employee_id": str(timesheet.employee.id),
            "date": timesheet.date.strftime("%Y-%m-%d"),
            "login_time": timesheet.login_time.strftime("%H:%M") if timesheet.login_time else None,
            "logout_time": timesheet.logout_time.strftime("%H:%M") if timesheet.logout_time else None,
            "total_hours": timesheet.total_hours,
            "status": timesheet.status,
            "remarks": timesheet.remarks,
            "approved_by": str(timesheet.approved_by.id) if timesheet.approved_by else None,
            "rejected_by": str(timesheet.rejected_by.id) if timesheet.rejected_by else None,
            "time_slots": timeslot_details
        }), 200



class AdminUpdateTimesheetStatus(MethodView):
    @jwt_required()
    def put(self, timesheet_id):
        admin = Admin.objects(id=get_jwt_identity()).first()
        if not admin:
            return jsonify({"error": "Admin not found"}), 404

        data = request.get_json()
        status = data.get("status")
        remarks = data.get("remarks", "")

        if status not in ["Approved", "Rejected"]:
            return jsonify({"error": "Invalid status. Must be 'Approved' or 'Rejected'."}), 400

        timesheet = Timesheet.objects(id=timesheet_id).first()
        if not timesheet:
            return jsonify({"error": "Timesheet not found"}), 404

        if timesheet.status in ["Approved", "Rejected"]:
            return jsonify({"error": f"Timesheet already {timesheet.status.lower()}."}), 400

        timesheet.status = status
        timesheet.remarks = remarks
        if status == "Approved":
            timesheet.approved_by = admin
            timesheet.approved_at = datetime.now()
            timesheet.rejected_by = None
            timesheet.rejected_at = None
        else:
            timesheet.rejected_by = admin
            timesheet.rejected_at = datetime.now()
            timesheet.approved_by = None
            timesheet.approved_at = None

        timesheet.updated_at = datetime.now()
        timesheet.save()

        return jsonify({"message": f"Timesheet {status.lower()} successfully."}), 200

       
import os   
import uuid
import boto3
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

admin_views = Blueprint('admin_views', __name__)

# AWS S3 Configuration from environment variables
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_S3_BUCKET = os.getenv("AWS_S3_BUCKET")
AWS_S3_REGION = os.getenv("AWS_S3_REGION")

def upload_image_to_s3(file_obj, folder="training_images"):
    try:
        s3 = boto3.client(
            's3',
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
            region_name=AWS_S3_REGION
        )
        filename = secure_filename(file_obj.filename)
        unique_filename = f"{folder}/{uuid.uuid4().hex}_{filename}"

        # Upload to S3
        s3.upload_fileobj(file_obj, AWS_S3_BUCKET, unique_filename)

        # Return public URL
        url = f"https://{AWS_S3_BUCKET}.s3.{AWS_S3_REGION}.amazonaws.com/{unique_filename}"
        return url
    except Exception as e:
        print("Error uploading to S3:", e)
        return None


class AdminCreateTraining(MethodView):
    @jwt_required()
    def post(self):
        admin_id = get_jwt_identity()
        admin = Admin.objects(id=admin_id).first()

        if not admin:
            return jsonify({"error": "Admin not found"}), 404

        # Expect multipart/form-data
        title = request.form.get("title")
        description = request.form.get("description")
        provider = request.form.get("provider")
        no_of_days = request.form.get("no_of_days")
        image = request.files.get("image")

        if not all([title, description, provider, no_of_days, image]):
            return jsonify({"error": "Missing required fields"}), 400

        try:
            image_url = upload_image_to_s3(image)
        except Exception as e:
            return jsonify({"error": f"Image upload failed: {str(e)}"}), 500

        training = TrainingAndLearning(
            employee=None,
            training_id=str(uuid.uuid4()),
            title=title,
            description=description,
            image=image_url,
            provider=provider,
            no_of_days=int(no_of_days),
            start_date=None,
            end_date=None,
            status="Enrolled"
        )
        training.save()

        return jsonify({"message": "Training template created successfully", "training_id": training.training_id}), 201

from flask import request, jsonify
from flask.views import MethodView
from flask_jwt_extended import jwt_required, get_jwt_identity
from mongoengine import Q
import uuid
from datetime import datetime

# ✅ Utility for updating timestamps
def update_timestamp(obj):
    obj.updated_at = ist_now()
    obj.save()
    return obj


# ✅ GET Trainings (all / by filters / by training_id)
class GetTrainings(MethodView):
    @jwt_required()
    def get(self, training_id=None):
        admin_id = get_jwt_identity()
        admin = Admin.objects(id=admin_id).first()
        if not admin:
            return jsonify({"error": "Admin not found"}), 404

        # If specific training_id is passed
        if training_id:
            training = TrainingAndLearning.objects(training_id=training_id).first()
            if not training:
                return jsonify({"error": f"Training {training_id} not found"}), 404

            return jsonify({
                "training_id": training.training_id,
                "title": training.title,
                "description": training.description,
                "provider": training.provider,
                "no_of_days": training.no_of_days,
                "image": training.image,
                "start_date": training.start_date,
                "end_date": training.end_date,
                "status": training.status,
                "created_at": training.created_at,
                "updated_at": training.updated_at
            }), 200

        # Filters (industry-level: optional params for pagination, status, provider)
        status = request.args.get("status")
        provider = request.args.get("provider")
        page = int(request.args.get("page", 1))
        limit = int(request.args.get("limit", 10))

        query = Q()
        if status:
            query &= Q(status=status)
        if provider:
            query &= Q(provider__icontains=provider)

        trainings = TrainingAndLearning.objects(query).skip((page - 1) * limit).limit(limit)

        return jsonify({
            "trainings": [
                {
                    "training_id": t.training_id,
                    "title": t.title,
                    "description": t.description,
                    "provider": t.provider,
                    "no_of_days": t.no_of_days,
                    "image": t.image,
                    "start_date": t.start_date,
                    "end_date": t.end_date,
                    "status": t.status,
                    "created_at": t.created_at,
                    "updated_at": t.updated_at
                }
                for t in trainings
            ],
            "pagination": {"page": page, "limit": limit, "count": trainings.count()}
        }), 200


# ✅ UPDATE Training (full/partial update)
class UpdateTraining(MethodView):
    @jwt_required()
    def put(self, training_id):
        admin_id = get_jwt_identity()
        admin = Admin.objects(id=admin_id).first()
        if not admin:
            return jsonify({"error": "Admin not found"}), 404

        training = TrainingAndLearning.objects(training_id=training_id).first()
        if not training:
            return jsonify({"error": f"Training {training_id} not found"}), 404

        data = request.form.to_dict() if request.form else request.get_json()

        # Update allowed fields
        updatable_fields = ["title", "description", "provider", "no_of_days", "start_date", "end_date", "status"]
        for field in updatable_fields:
            if field in data and data[field]:
                if field in ["no_of_days"]:
                    setattr(training, field, int(data[field]))
                elif field in ["start_date", "end_date"]:
                    setattr(training, field, datetime.fromisoformat(data[field]))
                else:
                    setattr(training, field, data[field])

        # Handle image if passed
        if "image" in request.files:
            image_url = upload_image_to_s3(request.files["image"], folder="training_images")
            training.image = image_url

        update_timestamp(training)

        return jsonify({
            "message": "Training updated successfully",
            "training_id": training.training_id
        }), 200
class UploadRecordSection(MethodView):
    @jwt_required()
    def post(self):
        current_user_id = get_jwt_identity()
        admin = Admin.objects(id=current_user_id).first()
        if not admin:
            return jsonify({'error': 'Admin not found'}), 404

        data = request.form.to_dict() if request.form else request.get_json()
        if not data:
            return jsonify({'error': 'No input data provided'}), 400

        # Required fields
        required_fields = ["meeting_record_id", "title", "day", "date_time", "video_url"]
        missing = [f for f in required_fields if f not in data or not data[f]]
        if missing:
            return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

        try:
            # Parse date dd/mm/yyyy
            date_time = datetime.strptime(data["date_time"], "%d/%m/%Y")
        except ValueError:
            return jsonify({"error": "Invalid date format. Use dd/mm/yyyy"}), 400

        # Create RecordingSection
        record = RecordingSection(
            employee=None,
            meeting_record_id=data["meeting_record_id"],
            title=data["title"],
            day=data["day"],
            date_time=date_time,
            description=data.get("description"),
            video_url=data["video_url"],   # Google Drive/Other link
            pdf_name=data.get("pdf_name"),
            Pdf_url=data.get("Pdf_url"),   # Optional Google Drive link
        )
        record.save()

        return jsonify({
            "message": "Recording uploaded successfully",
            "recording_id": str(record.id),
            "meeting_record_id": record.meeting_record_id,
            "title": record.title,
            "day": record.day,
            "date_time": record.date_time.strftime("%d/%m/%Y"),
            "video_url": record.video_url,
            "pdf_name": record.pdf_name,
            "Pdf_url": record.Pdf_url
        }), 201

class UpdateRecordSection(MethodView):
    @jwt_required()
    def put(self, record_id):
        current_user_id = get_jwt_identity()
        admin = Admin.objects(id=current_user_id).first()
        if not admin:
            return jsonify({'error': 'Admin not found'}), 404

        record = RecordingSection.objects(id=record_id).first()
        if not record:
            return jsonify({'error': f'Recording with id {record_id} not found'}), 404

        data = request.form.to_dict() if request.form else request.get_json()
        if not data:
            return jsonify({'error': 'No input data provided'}), 400

        # Update allowed fields
        if "meeting_record_id" in data:
            record.meeting_record_id = data["meeting_record_id"]
        if "title" in data:
            record.title = data["title"]
        if "day" in data:
            record.day = data["day"]
        if "date_time" in data:
            try:
                record.date_time = datetime.strptime(data["date_time"], "%d/%m/%Y")
            except ValueError:
                return jsonify({"error": "Invalid date format. Use dd/mm/yyyy"}), 400
        if "description" in data:
            record.description = data["description"]
        if "video_url" in data:
            record.video_url = data["video_url"]
        if "pdf_name" in data:
            record.pdf_name = data["pdf_name"]
        if "Pdf_url" in data:
            record.Pdf_url = data["Pdf_url"]

        record.updated_at = ist_now()
        record.save()

        return jsonify({
            "message": "Recording updated successfully",
            "recording_id": str(record.id),
            "meeting_record_id": record.meeting_record_id,
            "title": record.title,
            "day": record.day,
            "date_time": record.date_time.strftime("%d/%m/%Y"),
            "video_url": record.video_url,
            "pdf_name": record.pdf_name,
            "Pdf_url": record.Pdf_url
        }), 200

class GetRecordSection(MethodView):
    @jwt_required()
    def get(self, record_id=None):
        current_user_id = get_jwt_identity()
        admin = Admin.objects(id=current_user_id).first()
        if not admin:
            return jsonify({'error': 'Admin not found'}), 404

        if record_id:
            record = RecordingSection.objects(id=record_id).first()
            if not record:
                return jsonify({'error': f'Recording with id {record_id} not found'}), 404

            return jsonify({
                "recording_id": str(record.id),
                "meeting_record_id": record.meeting_record_id,
                "title": record.title,
                "day": record.day,
                "date_time": record.date_time.strftime("%d/%m/%Y"),
                "description": record.description,
                "video_url": record.video_url,
                "pdf_name": record.pdf_name,
                "Pdf_url": record.Pdf_url,
                "created_at": record.created_at.strftime("%d/%m/%Y %H:%M"),
                "updated_at": record.updated_at.strftime("%d/%m/%Y %H:%M")
            }), 200
        else:
            # Return all recordings
            records = RecordingSection.objects().order_by("-created_at")
            return jsonify([
                {
                    "recording_id": str(r.id),
                    "meeting_record_id": r.meeting_record_id,
                    "title": r.title,
                    "day": r.day,
                    "date_time": r.date_time.strftime("%d/%m/%Y"),
                    "video_url": r.video_url,
                    "pdf_name": r.pdf_name,
                    "Pdf_url": r.Pdf_url
                } for r in records
            ]), 200
