import * as React from "react";
import { Confirm } from "reactjs-components";
import StringUtil from "#SRC/js/utils/StringUtil";
import UserActions from "#SRC/js/constants/UserActions";

function defaultContent(jobId) {
  const defaultMessage = `Are you sure you want to ${
    UserActions.DELETE
  } ${jobId}? This action is irreversible.`;

  const defaultLabel = `${StringUtil.capitalize(UserActions.DELETE)} Job`;

  return {
    label: defaultLabel,
    message: modalContentHtml(defaultMessage)
  };
}

//FIX: content
//Fix: make it simpler to understand
function stopJobsCotent(jobId) {
  const stopCurrentRunsLabel = `Stop Current Runs and ${StringUtil.capitalize(
    UserActions.DELETE
  )} Job`;

  const stopCurrentRunsMessage = `Couldn't ${
    UserActions.DELETE
  } ${jobId} as there are currently active job runs. Do you want to stop all runs and ${
    UserActions.DELETE
  } the job?`;

  return {
    label: stopCurrentRunsLabel,
    message: modalContentHtml(stopCurrentRunsMessage)
  };
}

function modalContent(jobId, stopCurrentJobRuns) {
  const contentBuilder = stopCurrentJobRuns ? stopJobsCotent : defaultContent;

  return contentBuilder(jobId);
}

//FIX: Modal content
function modalContentHtml(message) {
  return (
    <div>
      <h2 className="text-danger text-align-center flush-top">
        {StringUtil.capitalize(UserActions.DELETE)} Job
      </h2>
      <p>{message}</p>
    </div>
  );
}

const JobDeleteModal = ({
  onClose,
  onSuccess,
  disabled,
  open,
  jobId,
  stopCurrentJobRuns
}) => {
  const { label, message } = modalContent(jobId, stopCurrentJobRuns);

  return (
    <Confirm
      disabled={disabled}
      open={open}
      children={message}
      leftButtonText="Cancel"
      leftButtonClassName="button button-primary-link"
      leftButtonCallback={onClose}
      rightButtonText={label}
      rightButtonClassName="button button-danger"
      rightButtonCallback={onSuccess}
    />
  );
};
export default JobDeleteModal;
