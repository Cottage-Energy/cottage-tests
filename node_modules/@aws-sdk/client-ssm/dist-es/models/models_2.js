import { SENSITIVE_STRING } from "@smithy/smithy-client";
import { AssociationDescriptionFilterSensitiveLog, PatchSourceFilterSensitiveLog, } from "./models_0";
import { CommandFilterSensitiveLog, MaintenanceWindowTaskInvocationParametersFilterSensitiveLog, } from "./models_1";
import { SSMServiceException as __BaseException } from "./SSMServiceException";
export class AutomationStepNotFoundException extends __BaseException {
    constructor(opts) {
        super({
            name: "AutomationStepNotFoundException",
            $fault: "client",
            ...opts,
        });
        this.name = "AutomationStepNotFoundException";
        this.$fault = "client";
        Object.setPrototypeOf(this, AutomationStepNotFoundException.prototype);
        this.Message = opts.Message;
    }
}
export class InvalidAutomationSignalException extends __BaseException {
    constructor(opts) {
        super({
            name: "InvalidAutomationSignalException",
            $fault: "client",
            ...opts,
        });
        this.name = "InvalidAutomationSignalException";
        this.$fault = "client";
        Object.setPrototypeOf(this, InvalidAutomationSignalException.prototype);
        this.Message = opts.Message;
    }
}
export const SignalType = {
    APPROVE: "Approve",
    REJECT: "Reject",
    RESUME: "Resume",
    START_STEP: "StartStep",
    STOP_STEP: "StopStep",
};
export class InvalidNotificationConfig extends __BaseException {
    constructor(opts) {
        super({
            name: "InvalidNotificationConfig",
            $fault: "client",
            ...opts,
        });
        this.name = "InvalidNotificationConfig";
        this.$fault = "client";
        Object.setPrototypeOf(this, InvalidNotificationConfig.prototype);
        this.Message = opts.Message;
    }
}
export class InvalidOutputFolder extends __BaseException {
    constructor(opts) {
        super({
            name: "InvalidOutputFolder",
            $fault: "client",
            ...opts,
        });
        this.name = "InvalidOutputFolder";
        this.$fault = "client";
        Object.setPrototypeOf(this, InvalidOutputFolder.prototype);
    }
}
export class InvalidRole extends __BaseException {
    constructor(opts) {
        super({
            name: "InvalidRole",
            $fault: "client",
            ...opts,
        });
        this.name = "InvalidRole";
        this.$fault = "client";
        Object.setPrototypeOf(this, InvalidRole.prototype);
        this.Message = opts.Message;
    }
}
export class InvalidAssociation extends __BaseException {
    constructor(opts) {
        super({
            name: "InvalidAssociation",
            $fault: "client",
            ...opts,
        });
        this.name = "InvalidAssociation";
        this.$fault = "client";
        Object.setPrototypeOf(this, InvalidAssociation.prototype);
        this.Message = opts.Message;
    }
}
export class AutomationDefinitionNotFoundException extends __BaseException {
    constructor(opts) {
        super({
            name: "AutomationDefinitionNotFoundException",
            $fault: "client",
            ...opts,
        });
        this.name = "AutomationDefinitionNotFoundException";
        this.$fault = "client";
        Object.setPrototypeOf(this, AutomationDefinitionNotFoundException.prototype);
        this.Message = opts.Message;
    }
}
export class AutomationDefinitionVersionNotFoundException extends __BaseException {
    constructor(opts) {
        super({
            name: "AutomationDefinitionVersionNotFoundException",
            $fault: "client",
            ...opts,
        });
        this.name = "AutomationDefinitionVersionNotFoundException";
        this.$fault = "client";
        Object.setPrototypeOf(this, AutomationDefinitionVersionNotFoundException.prototype);
        this.Message = opts.Message;
    }
}
export class AutomationExecutionLimitExceededException extends __BaseException {
    constructor(opts) {
        super({
            name: "AutomationExecutionLimitExceededException",
            $fault: "client",
            ...opts,
        });
        this.name = "AutomationExecutionLimitExceededException";
        this.$fault = "client";
        Object.setPrototypeOf(this, AutomationExecutionLimitExceededException.prototype);
        this.Message = opts.Message;
    }
}
export class InvalidAutomationExecutionParametersException extends __BaseException {
    constructor(opts) {
        super({
            name: "InvalidAutomationExecutionParametersException",
            $fault: "client",
            ...opts,
        });
        this.name = "InvalidAutomationExecutionParametersException";
        this.$fault = "client";
        Object.setPrototypeOf(this, InvalidAutomationExecutionParametersException.prototype);
        this.Message = opts.Message;
    }
}
export class AutomationDefinitionNotApprovedException extends __BaseException {
    constructor(opts) {
        super({
            name: "AutomationDefinitionNotApprovedException",
            $fault: "client",
            ...opts,
        });
        this.name = "AutomationDefinitionNotApprovedException";
        this.$fault = "client";
        Object.setPrototypeOf(this, AutomationDefinitionNotApprovedException.prototype);
        this.Message = opts.Message;
    }
}
export var ExecutionInputs;
(function (ExecutionInputs) {
    ExecutionInputs.visit = (value, visitor) => {
        if (value.Automation !== undefined)
            return visitor.Automation(value.Automation);
        return visitor._(value.$unknown[0], value.$unknown[1]);
    };
})(ExecutionInputs || (ExecutionInputs = {}));
export class ValidationException extends __BaseException {
    constructor(opts) {
        super({
            name: "ValidationException",
            $fault: "client",
            ...opts,
        });
        this.name = "ValidationException";
        this.$fault = "client";
        Object.setPrototypeOf(this, ValidationException.prototype);
        this.Message = opts.Message;
        this.ReasonCode = opts.ReasonCode;
    }
}
export class TargetNotConnected extends __BaseException {
    constructor(opts) {
        super({
            name: "TargetNotConnected",
            $fault: "client",
            ...opts,
        });
        this.name = "TargetNotConnected";
        this.$fault = "client";
        Object.setPrototypeOf(this, TargetNotConnected.prototype);
        this.Message = opts.Message;
    }
}
export class InvalidAutomationStatusUpdateException extends __BaseException {
    constructor(opts) {
        super({
            name: "InvalidAutomationStatusUpdateException",
            $fault: "client",
            ...opts,
        });
        this.name = "InvalidAutomationStatusUpdateException";
        this.$fault = "client";
        Object.setPrototypeOf(this, InvalidAutomationStatusUpdateException.prototype);
        this.Message = opts.Message;
    }
}
export const StopType = {
    CANCEL: "Cancel",
    COMPLETE: "Complete",
};
export class AssociationVersionLimitExceeded extends __BaseException {
    constructor(opts) {
        super({
            name: "AssociationVersionLimitExceeded",
            $fault: "client",
            ...opts,
        });
        this.name = "AssociationVersionLimitExceeded";
        this.$fault = "client";
        Object.setPrototypeOf(this, AssociationVersionLimitExceeded.prototype);
        this.Message = opts.Message;
    }
}
export class InvalidUpdate extends __BaseException {
    constructor(opts) {
        super({
            name: "InvalidUpdate",
            $fault: "client",
            ...opts,
        });
        this.name = "InvalidUpdate";
        this.$fault = "client";
        Object.setPrototypeOf(this, InvalidUpdate.prototype);
        this.Message = opts.Message;
    }
}
export class StatusUnchanged extends __BaseException {
    constructor(opts) {
        super({
            name: "StatusUnchanged",
            $fault: "client",
            ...opts,
        });
        this.name = "StatusUnchanged";
        this.$fault = "client";
        Object.setPrototypeOf(this, StatusUnchanged.prototype);
    }
}
export class DocumentVersionLimitExceeded extends __BaseException {
    constructor(opts) {
        super({
            name: "DocumentVersionLimitExceeded",
            $fault: "client",
            ...opts,
        });
        this.name = "DocumentVersionLimitExceeded";
        this.$fault = "client";
        Object.setPrototypeOf(this, DocumentVersionLimitExceeded.prototype);
        this.Message = opts.Message;
    }
}
export class DuplicateDocumentContent extends __BaseException {
    constructor(opts) {
        super({
            name: "DuplicateDocumentContent",
            $fault: "client",
            ...opts,
        });
        this.name = "DuplicateDocumentContent";
        this.$fault = "client";
        Object.setPrototypeOf(this, DuplicateDocumentContent.prototype);
        this.Message = opts.Message;
    }
}
export class DuplicateDocumentVersionName extends __BaseException {
    constructor(opts) {
        super({
            name: "DuplicateDocumentVersionName",
            $fault: "client",
            ...opts,
        });
        this.name = "DuplicateDocumentVersionName";
        this.$fault = "client";
        Object.setPrototypeOf(this, DuplicateDocumentVersionName.prototype);
        this.Message = opts.Message;
    }
}
export const DocumentReviewAction = {
    Approve: "Approve",
    Reject: "Reject",
    SendForReview: "SendForReview",
    UpdateReview: "UpdateReview",
};
export class OpsMetadataKeyLimitExceededException extends __BaseException {
    constructor(opts) {
        super({
            name: "OpsMetadataKeyLimitExceededException",
            $fault: "client",
            ...opts,
        });
        this.name = "OpsMetadataKeyLimitExceededException";
        this.$fault = "client";
        Object.setPrototypeOf(this, OpsMetadataKeyLimitExceededException.prototype);
    }
}
export class ResourceDataSyncConflictException extends __BaseException {
    constructor(opts) {
        super({
            name: "ResourceDataSyncConflictException",
            $fault: "client",
            ...opts,
        });
        this.name = "ResourceDataSyncConflictException";
        this.$fault = "client";
        Object.setPrototypeOf(this, ResourceDataSyncConflictException.prototype);
        this.Message = opts.Message;
    }
}
export const SendCommandRequestFilterSensitiveLog = (obj) => ({
    ...obj,
    ...(obj.Parameters && { Parameters: SENSITIVE_STRING }),
});
export const SendCommandResultFilterSensitiveLog = (obj) => ({
    ...obj,
    ...(obj.Command && { Command: CommandFilterSensitiveLog(obj.Command) }),
});
export const UpdateAssociationRequestFilterSensitiveLog = (obj) => ({
    ...obj,
    ...(obj.Parameters && { Parameters: SENSITIVE_STRING }),
});
export const UpdateAssociationResultFilterSensitiveLog = (obj) => ({
    ...obj,
    ...(obj.AssociationDescription && {
        AssociationDescription: AssociationDescriptionFilterSensitiveLog(obj.AssociationDescription),
    }),
});
export const UpdateAssociationStatusResultFilterSensitiveLog = (obj) => ({
    ...obj,
    ...(obj.AssociationDescription && {
        AssociationDescription: AssociationDescriptionFilterSensitiveLog(obj.AssociationDescription),
    }),
});
export const UpdateMaintenanceWindowRequestFilterSensitiveLog = (obj) => ({
    ...obj,
    ...(obj.Description && { Description: SENSITIVE_STRING }),
});
export const UpdateMaintenanceWindowResultFilterSensitiveLog = (obj) => ({
    ...obj,
    ...(obj.Description && { Description: SENSITIVE_STRING }),
});
export const UpdateMaintenanceWindowTargetRequestFilterSensitiveLog = (obj) => ({
    ...obj,
    ...(obj.OwnerInformation && { OwnerInformation: SENSITIVE_STRING }),
    ...(obj.Description && { Description: SENSITIVE_STRING }),
});
export const UpdateMaintenanceWindowTargetResultFilterSensitiveLog = (obj) => ({
    ...obj,
    ...(obj.OwnerInformation && { OwnerInformation: SENSITIVE_STRING }),
    ...(obj.Description && { Description: SENSITIVE_STRING }),
});
export const UpdateMaintenanceWindowTaskRequestFilterSensitiveLog = (obj) => ({
    ...obj,
    ...(obj.TaskParameters && { TaskParameters: SENSITIVE_STRING }),
    ...(obj.TaskInvocationParameters && {
        TaskInvocationParameters: MaintenanceWindowTaskInvocationParametersFilterSensitiveLog(obj.TaskInvocationParameters),
    }),
    ...(obj.Description && { Description: SENSITIVE_STRING }),
});
export const UpdateMaintenanceWindowTaskResultFilterSensitiveLog = (obj) => ({
    ...obj,
    ...(obj.TaskParameters && { TaskParameters: SENSITIVE_STRING }),
    ...(obj.TaskInvocationParameters && {
        TaskInvocationParameters: MaintenanceWindowTaskInvocationParametersFilterSensitiveLog(obj.TaskInvocationParameters),
    }),
    ...(obj.Description && { Description: SENSITIVE_STRING }),
});
export const UpdatePatchBaselineRequestFilterSensitiveLog = (obj) => ({
    ...obj,
    ...(obj.Sources && { Sources: obj.Sources.map((item) => PatchSourceFilterSensitiveLog(item)) }),
});
export const UpdatePatchBaselineResultFilterSensitiveLog = (obj) => ({
    ...obj,
    ...(obj.Sources && { Sources: obj.Sources.map((item) => PatchSourceFilterSensitiveLog(item)) }),
});
