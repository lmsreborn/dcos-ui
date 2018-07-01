import * as React from "react";
import { componentFromStream, graphqlObservable } from "data-service";
import { Subject } from "rxjs/Subject";
import "rxjs/add/operator/map";
import "rxjs/add/operator/switchMap";
import "rxjs/add/operator/do";
import "rxjs/add/operator/combineLatest";
import "rxjs/add/operator/startWith";
import "rxjs/add/operator/catch";

import gql from "graphql-tag";

import JobDeleteModal from "./components/JobDeleteModal";
import defaultSchema from "./data/JobModel";

const deleteJob = gql`
  mutation {
    deleteJob(id: $jobId, stopCurrentJobRuns: $stopCurrentJobRuns) {
      jobId
    }
  }
`;

function executeDelete({ jobId, stopCurrentJobRuns, onSuccess, errorMsg }) {
  return graphqlObservable(deleteJob, defaultSchema, {
    jobId,
    stopCurrentJobRuns
  })
    .map(_ => ({ done: true, stopCurrentJobRuns, errorMsg }))
    .do(_ => onSuccess())
    .startWith({ done: false, stopCurrentJobRuns, errorMsg });
}

function deleteOperation() {
  const deleteSubject$ = new Subject();
  const delete$ = deleteSubject$.switchMap(executeDelete).catch(error => {
    return delete$.startWith({
      errorMsg: error.response.message,
      done: true
    });
  });

  return {
    delete$,
    deleteHandler: (jobId, stopCurrentJobRuns, onSuccess, errorMsg) => {
      deleteSubject$.next({ jobId, stopCurrentJobRuns, onSuccess, errorMsg });
    }
  };
}

function errorIsTaskCurrentRunning(errorMsg) {
  return /stopCurrentJobRuns=true/.test(errorMsg);
}

const JobDelete = componentFromStream(prop$ => {
  const { delete$, deleteHandler } = deleteOperation();
  const deleteEmit$ = delete$.startWith({ done: null });

  return prop$
    .combineLatest(deleteEmit$, (props, deleteOp) => {
      return { ...props, ...deleteOp };
    })
    .map(({ open, jobId, onClose, onSuccess, errorMsg, done }) => {
      const isDisabled = done === false;
      const isOpen = open;

      const stopCurrentJobRuns = errorIsTaskCurrentRunning(errorMsg);

      const onSuccessEvent = () => {
        deleteHandler(jobId, stopCurrentJobRuns, onSuccess, errorMsg);
      };

      const onCloseEvent = () => {
        onClose();
      };

      return (
        <JobDeleteModal
          onClose={onCloseEvent}
          onSuccess={onSuccessEvent}
          disabled={isDisabled}
          open={isOpen}
          jobId={jobId}
          stopCurrentJobRuns={stopCurrentJobRuns}
        />
      );
    });
});

export default JobDelete;
