from flask import Blueprint
from ..views import admin_views

admin_bp = Blueprint('admin_bp', __name__) # Removed url_prefix here, it's in app.register_blueprint




admin_bp.add_url_rule(
    "/register",
    view_func=admin_views.RegisterAdmin.as_view("register_admin_api"),
    methods=["POST"]
)

admin_bp.add_url_rule(
    "/adminlogin",
    view_func=admin_views.AdminLoginAPI.as_view("admin_login_api"),
    methods=["POST"]
)

admin_bp.add_url_rule("/refresh", view_func=admin_views.RefreshAPI.as_view("refresh_api"), methods=["POST"])

admin_bp.add_url_rule(
    "/upload-employe",
    view_func=admin_views.UploadEmploye.as_view("upload_employe_api"),
    methods=["POST"]
)

admin_bp.add_url_rule(
    "/get-employe/<employee_id>",
    view_func=admin_views.GetEmployee.as_view("get_employe_api"),
    methods=["GET"]
)

admin_bp.add_url_rule(
    "/get-all-employe",
    view_func=admin_views.GetAllEmployees.as_view("get_all_employe_api"),
    methods=["GET"]
)

admin_bp.add_url_rule(
    "/upload-task",
    view_func=admin_views.UploadTask.as_view("upload_task_api"),
    methods=["POST"]
)

admin_bp.add_url_rule(
    "/update-task/<task_id>",
    view_func=admin_views.UpdateTask.as_view("upload_project_api"),
    methods=["PUT"]
)

admin_bp.add_url_rule(
    "/get-task/<task_id>",
    view_func=admin_views.GetTask.as_view("get_task_api"),
    methods=["GET"]
)

admin_bp.add_url_rule(
    "/get-all-task",
    view_func=admin_views.GetAllTasks.as_view("get_all_task_api"),
    methods=["GET"]
)

admin_bp.add_url_rule(
    "/update-task-status/<task_id>",
    view_func=admin_views.UpdateTaskApprovalStatus.as_view("update_task_status_api"),
    methods=["PUT"]
)

admin_bp.add_url_rule(
    "/create-meeting",
    view_func=admin_views.CreateMeeting.as_view("create_meeting_api"),
    methods=["POST"]
)

admin_bp.add_url_rule(
    "/create-all-meeting",
    view_func=admin_views.CreateMeetingForAll.as_view("create_all_meeting_api"),
    methods=["POST"]
)


admin_bp.add_url_rule(
    "/update-meeting/<meeting_id>",
    view_func=admin_views.UpdateMeeting.as_view("update_meeting_api"),
    methods=["PUT"]
)

admin_bp.add_url_rule(
    "/get-meeting-by-employee/<employee_id>",
    view_func=admin_views.GetMeetingByEmployee.as_view("get_meeting_by_employee_api"),
    methods=["GET"]
)

admin_bp.add_url_rule(
    "/get-meeting",
    view_func=admin_views.GetAllMeetings.as_view("get_meeting_by_id_api"),
    methods=["GET"]
)
admin_bp.add_url_rule(
    "/delete-meeting/<meeting_id>",
    view_func=admin_views.DeleteMeeting.as_view("delete_meeting_api"),
    methods=["DELETE"]
 )

admin_bp.add_url_rule(
    "/get-DocumentUpload/<employee_id>",
    view_func=admin_views.GetDocumentUpload.as_view("get_employee_documents_api"),
    methods=["GET"]
)
admin_bp.add_url_rule(
    "/UpdateStatusDocumentUpload/<document_id>",
    view_func=admin_views.UpdateStatusDocumentUpload.as_view("update_status_document_upload_api"),
    methods=["PUT"]
)


admin_bp.add_url_rule(
    "/timesheet/<timesheet_id>",
    view_func=admin_views.AdminViewSingleTimesheet.as_view("timesheet_api "),
    methods=["GET"]
)

admin_bp.add_url_rule(
    "/update-timesheet-status/<timesheet_id>",
    view_func=admin_views.AdminUpdateTimesheetStatus.as_view("update_timesheet_status_api"),
    methods=["PUT"]
)

admin_bp.add_url_rule(
    "/create-training",
    view_func=admin_views.AdminCreateTraining.as_view("create_training_api"),
    methods=["POST"]
)

# Add routes
admin_bp.add_url_rule("/trainings", view_func=admin_views.GetTrainings.as_view("get_trainings_all"), methods=["GET"])
admin_bp.add_url_rule("/trainings/<training_id>", view_func=admin_views.GetTrainings.as_view("get_training"), methods=["GET"])
admin_bp.add_url_rule("/trainings/<training_id>", view_func=admin_views.UpdateTraining.as_view("update_training"), methods=["PUT"])

admin_bp.add_url_rule(
    "/upload-recording", view_func=admin_views.UploadRecordSection.as_view("upload_recording")
)
admin_bp.add_url_rule(
    "/update-recording/<record_id>", view_func=admin_views.UpdateRecordSection.as_view("update_recording")
)
admin_bp.add_url_rule(
    "/get-recording", view_func=admin_views.GetRecordSection.as_view("get_all_recordings")
)
admin_bp.add_url_rule(
    "/get-recording/<record_id>", view_func=admin_views.GetRecordSection.as_view("get_single_recording")
)
