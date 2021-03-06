/* eslint-disable no-unused-vars */
import React from "react";
/* eslint-enable no-unused-vars */
import { routerShape } from "react-router";
import PropTypes from "prop-types";

import mixin from "reactjs-mixin";

import Page from "#SRC/js/components/Page";
import TabsMixin from "#SRC/js/mixins/TabsMixin";
import Job from "#SRC/js/structs/Job";
import Util from "#SRC/js/utils/Util";

import JobFormModalContainer from "../JobFormModalContainer";
import JobConfiguration from "./JobConfiguration";
import { DIALOGS } from "../JobDetailPageContainer";
import JobRunHistoryTable from "./JobRunHistoryTable";
import ItemSchedule from "../components/breadcrumbs/Schedule";
import ItemStatus from "../components/breadcrumbs/Status";
import Breadcrumbs from "../components/Breadcrumbs";

class JobDetailPage extends mixin(TabsMixin) {
  constructor() {
    super(...arguments);
    this.renderBreadcrumbStates = this.renderBreadcrumbStates.bind(this);

    this.tabs_tabs = {
      runHistory: "Run History",
      configuration: "Configuration"
    };

    this.state = {
      currentTab: Object.keys(this.tabs_tabs).shift()
    };
  }

  getNavigationTabs() {
    return <ul className="menu-tabbed">{this.tabs_getUnroutedTabs()}</ul>;
  }

  getDestroyConfirmDialog() {
    return null;
  }

  renderConfigurationTabView(job) {
    return <JobConfiguration job={job} />;
  }

  renderRunHistoryTabView(job) {
    return <JobRunHistoryTable job={job} />;
  }

  renderBreadcrumbStates(item) {
    const status = Util.findNestedPropertyInObject(
      item,
      "jobRuns.longestRunningActiveRun.tasks.longestRunningTask.status"
    );

    let schedule = null;
    if (
      item.schedules &&
      item.schedules.nodes.length &&
      item.schedules.nodes[0].enabled
    ) {
      schedule = item.schedules.nodes[0];
    }

    return [
      schedule ? <ItemSchedule key="schedule" schedule={schedule} /> : null,
      status ? <ItemStatus key="status" status={status} /> : null
    ];
  }

  getActions() {
    return [
      {
        label: "Edit",
        onItemSelect: this.props.handleEditButtonClick
      }
    ];
  }

  getTabs() {
    const activeTab = this.state.currentTab;

    return [
      {
        label: "Run History",
        callback: () => {
          this.setState({ currentTab: "runHistory" });
        },
        isActive: activeTab === "runHistory"
      },
      {
        label: "Configuration",
        callback: () => {
          this.setState({ currentTab: "configuration" });
        },
        isActive: activeTab === "configuration"
      }
    ];
  }

  render() {
    if (this.props.params.taskID) {
      return this.props.children;
    }

    const { job } = this.props;

    // TODO: wait for https://github.com/dcos/dcos-ui/pull/3029 to be merged and remove this line
    const breadcrumbJob = { ...job, path: [] };

    return (
      <Page>
        <Page.Header
          actions={this.getActions()}
          breadcrumbs={
            <Breadcrumbs
              states={this.renderBreadcrumbStates(breadcrumbJob)}
              item={breadcrumbJob}
            />
          }
          tabs={this.getTabs()}
        />
        {this.tabs_getTabView(job)}
        <JobFormModalContainer
          isEdit={true}
          job={new Job(JSON.parse(job.json))}
          open={this.props.jobActionDialog === DIALOGS.EDIT}
          onClose={this.props.closeDialog}
        />
        {this.getDestroyConfirmDialog()}
      </Page>
    );
  }
}

JobDetailPage.contextTypes = {
  router: routerShape
};

JobDetailPage.propTypes = {
  children: PropTypes.any,
  closeDialog: PropTypes.func,
  job: PropTypes.shape({
    json: PropTypes.string.isRequired
  }),
  jobActionDialog: PropTypes.any
};

module.exports = JobDetailPage;
