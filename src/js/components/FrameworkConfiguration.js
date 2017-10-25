import React, { PropTypes, Component } from "react";
import { Confirm } from "reactjs-components";

import FullScreenModal from "#SRC/js/components/modals/FullScreenModal";
import FullScreenModalHeader
  from "#SRC/js/components/modals/FullScreenModalHeader";
import FullScreenModalHeaderActions
  from "#SRC/js/components/modals/FullScreenModalHeaderActions";
import FullScreenModalHeaderTitle
  from "#SRC/js/components/modals/FullScreenModalHeaderTitle";
import FullScreenModalHeaderSubTitle
  from "#SRC/js/components/modals/FullScreenModalHeaderSubTitle";
import ToggleButton from "#SRC/js/components/ToggleButton";
import HashMapDisplay from "#SRC/js/components/HashMapDisplay";
import ModalHeading from "#SRC/js/components/modals/ModalHeading";
import UniversePackage from "#SRC/js/structs/UniversePackage";
import Icon from "#SRC/js/components/Icon";
import Util from "#SRC/js/utils/Util";
import StringUtil from "#SRC/js/utils/StringUtil";
import CosmosErrorMessage from "#SRC/js/components/CosmosErrorMessage";
import RouterUtil from "#SRC/js/utils/RouterUtil";
import FrameworkConfigurationForm
  from "#SRC/js/components/FrameworkConfigurationForm";

const METHODS_TO_BIND = [
  "handleJSONToggle",
  "handleGoBack",
  "handleServiceReview",
  "handleEditConfigurationButtonClick",
  "handleActiveTabChange",
  "handleFocusFieldChange",
  "handleCloseConfirmModal",
  "handleConfirmGoBack",
  "onFormDataChange",
  "onFormErrorChange"
];
class FrameworkConfiguration extends Component {
  constructor(props) {
    super(props);

    const { activeTab, focusField } = this.getFirstTabAndField();

    this.state = {
      reviewActive: props.isInitialDeploy,
      activeTab,
      focusField,
      jsonEditorActive: false,
      hasChangesApplied: false,
      isConfirmOpen: false,
      isOpen: true
    };

    METHODS_TO_BIND.forEach(method => {
      this[method] = this[method].bind(this);
    });
  }

  onFormDataChange(formData) {
    this.props.onFormDataChange(formData);

    this.setState({ hasChangesApplied: true });
  }

  onFormErrorChange(formErrors) {
    this.props.onFormErrorChange(formErrors);
  }

  handleFocusFieldChange(activeTab, focusField) {
    if (focusField === this.state.focusField) {
      return false;
    }

    this.setState({ focusField, activeTab });
  }

  handleActiveTabChange(activeTab) {
    const { currentActiveTab } = this.state;
    const { packageDetails } = this.props;
    const schema = packageDetails.getConfig();

    if (activeTab === currentActiveTab) {
      return false;
    }

    const focusField = this.getFirstFieldInTab(schema, activeTab);

    this.setState({ activeTab, focusField });
  }

  handleEditConfigurationButtonClick() {
    const { activeTab, focusField } = this.getFirstTabAndField();

    this.setState({ reviewActive: false, activeTab, focusField });
  }

  getHashMapRenderKeys(formData) {
    if (!Util.isObject(formData)) {
      return {};
    }

    let renderKeys = {};
    Object.keys(formData).forEach(key => {
      const formattedKey = key
        .toLowerCase()
        .split(/_|-/)
        .map(word => StringUtil.capitalize(word))
        .join(" ");

      renderKeys[key] = formattedKey;
      renderKeys = Object.assign(
        renderKeys,
        this.getHashMapRenderKeys(formData[key])
      );
    });

    return renderKeys;
  }

  getFirstFieldInTab(schema, tab) {
    // don't assume schema has two-levels of fields with properties
    // for autofocus we return a field id name, if no fields return string "no-op"
    if (
      schema.properties[tab] &&
      schema.properties[tab].properties &&
      Object.keys(schema.properties[tab].properties).length >= 1
    ) {
      return Object.keys(schema.properties[tab].properties)[0];
    }

    return "NO-OP";
  }

  getFirstTabAndField() {
    const { packageDetails } = this.props;
    const schema = packageDetails.getConfig();

    const [activeTab] = Object.keys(schema.properties);
    const focusField = this.getFirstFieldInTab(schema, activeTab);

    return {
      activeTab,
      focusField
    };
  }

  handleJSONToggle() {
    this.setState({ jsonEditorActive: !this.state.jsonEditorActive });
  }

  handleCloseConfirmModal() {
    this.setState({ isConfirmOpen: false });
  }

  handleGoBack() {
    const { reviewActive, hasChangesApplied } = this.state;

    if (reviewActive && hasChangesApplied) {
      this.setState({ reviewActive: false });

      return;
    }

    if (hasChangesApplied) {
      this.setState({ isConfirmOpen: true });

      return;
    }

    this.handleConfirmGoBack();
  }

  handleServiceReview() {
    const { handleRun } = this.props;
    const { reviewActive } = this.state;

    if (reviewActive) {
      handleRun();

      return;
    }

    this.setState({ reviewActive: true });
  }

  handleConfirmGoBack() {
    const { handleGoBack } = this.props;

    this.setState({ isConfirmOpen: false, isOpen: false }, () => {
      // Once state is set, start a timer for the length of the animation and
      // navigate away once the animation is over.
      setTimeout(handleGoBack, 300);
    });
  }

  getSecondaryActions() {
    const { reviewActive, hasChangesApplied } = this.state;

    return [
      {
        className: "button-stroke",
        clickHandler: this.handleGoBack,
        label: reviewActive && hasChangesApplied ? " Back" : "Cancel"
      }
    ];
  }

  getPrimaryActions() {
    const { jsonEditorActive, reviewActive } = this.state;
    const { formErrors } = this.props;

    const hasFormErrors = Object.keys(formErrors).reduce(
      (sum, tab) => sum + formErrors[tab],
      0
    );

    const actions = [
      {
        className: "button-primary flush-vertical",
        clickHandler: this.handleServiceReview,
        label: reviewActive ? "Run Service" : "Review & Run",
        disabled: hasFormErrors
      }
    ];

    if (!reviewActive) {
      actions.unshift({
        node: (
          <ToggleButton
            className="flush"
            checkboxClassName="toggle-button toggle-button-align-left"
            checked={jsonEditorActive}
            onChange={this.handleJSONToggle}
            key="json-editor"
          >
            JSON Editor
          </ToggleButton>
        )
      });
    }

    return actions;
  }

  getReviewScreen() {
    const {
      packageDetails,
      deployErrors,
      isInitialDeploy,
      formData
    } = this.props;

    const fileName = "config.json";
    const configString = JSON.stringify(formData, null, 2);

    const renderKeys = this.getHashMapRenderKeys(formData);

    const preInstallNotes = packageDetails.getPreInstallNotes();
    let preinstall = null;
    if (preInstallNotes && isInitialDeploy) {
      const preInstallNotesParsed = StringUtil.parseMarkdown(preInstallNotes);
      preInstallNotesParsed.__html =
        "<strong>Preinstall Notes: </strong>" + preInstallNotesParsed.__html;

      preinstall = (
        <div
          dangerouslySetInnerHTML={preInstallNotesParsed}
          className="pre-install-notes message message-warning"
        />
      );
    }

    let errorsAlert = null;
    if (deployErrors) {
      errorsAlert = <CosmosErrorMessage error={deployErrors} />;
    }

    return (
      <div className="flex-item-grow-1">
        <div className="container container-wide">
          {errorsAlert}
          {preinstall}
          <div className="row">
            <div className="column-4">
              <h1 className="flush-top">Configuration</h1>
            </div>
            <div className="column-8 text-align-right">
              <button
                className="button button-primary-link button-inline-flex"
                onClick={this.handleEditConfigurationButtonClick}
              >
                <Icon id="pencil" size="mini" family="system" />
                <span className="form-group-heading-content">
                  {"Edit Config"}
                </span>
              </button>
              <a
                className="button button-primary-link flush-right"
                download={fileName}
                onClick={RouterUtil.triggerIEDownload.bind(
                  null,
                  fileName,
                  configString
                )}
                href={RouterUtil.getResourceDownloadPath(
                  "attachment/json",
                  fileName,
                  configString
                )}
              >
                <Icon id="download" size="mini" family="system" />
                <span className="form-group-heading-content">
                  {"Download Config"}
                </span>
              </a>
            </div>
          </div>
          <HashMapDisplay
            hash={formData}
            renderKeys={renderKeys}
            headlineClassName={"text-capitalize"}
            emptyValue={"\u2014"}
          />
        </div>
      </div>
    );
  }

  getHeader() {
    const { reviewActive } = this.state;
    const { packageDetails } = this.props;

    return (
      <FullScreenModalHeader>
        <FullScreenModalHeaderActions
          actions={this.getSecondaryActions()}
          type="secondary"
        />
        <FullScreenModalHeaderTitle className="modal-full-screen-header-with-sub-title">
          {reviewActive ? "Review Configuration" : "Edit Configuration"}
          <FullScreenModalHeaderSubTitle>
            {StringUtil.capitalize(packageDetails.getName()) +
              " " +
              packageDetails.getVersion()}
          </FullScreenModalHeaderSubTitle>
        </FullScreenModalHeaderTitle>
        <FullScreenModalHeaderActions
          actions={this.getPrimaryActions()}
          type="primary"
        />
      </FullScreenModalHeader>
    );
  }

  render() {
    const {
      isConfirmOpen,
      isOpen,
      reviewActive,
      jsonEditorActive,
      focusField,
      activeTab
    } = this.state;
    const { packageDetails, deployErrors, formErrors, formData } = this.props;

    let pageContents;
    if (reviewActive) {
      pageContents = this.getReviewScreen();
    } else {
      pageContents = (
        <FrameworkConfigurationForm
          packageDetails={packageDetails}
          jsonEditorActive={jsonEditorActive}
          formData={formData}
          formErrors={formErrors}
          focusField={focusField}
          activeTab={activeTab}
          deployErrors={deployErrors}
          onFormDataChange={this.onFormDataChange}
          onFormErrorChange={this.onFormErrorChange}
          handleActiveTabChange={this.handleActiveTabChange}
          handleFocusFieldChange={this.handleFocusFieldChange}
        />
      );
    }

    return (
      <FullScreenModal
        header={this.getHeader()}
        useGemini={reviewActive}
        open={isOpen}
      >
        {pageContents}
        <Confirm
          closeByBackdropClick={true}
          header={<ModalHeading>Discard Changes?</ModalHeading>}
          open={isConfirmOpen}
          onClose={this.handleCloseConfirmModal}
          leftButtonText="Cancel"
          leftButtonCallback={this.handleCloseConfirmModal}
          rightButtonText="Discard"
          rightButtonClassName="button button-danger"
          rightButtonCallback={this.handleConfirmGoBack}
          showHeader={true}
        >
          <p>
            Are you sure you want to leave this page? Any data you entered will be lost.
          </p>
        </Confirm>
      </FullScreenModal>
    );
  }
}

FrameworkConfiguration.propTypes = {
  formData: PropTypes.object.isRequired,
  onFormDataChange: PropTypes.func.isRequired,
  packageDetails: PropTypes.instanceOf(UniversePackage).isRequired,
  handleRun: PropTypes.func.isRequired,
  handleGoBack: PropTypes.func.isRequired,
  isInitialDeploy: PropTypes.bool.isRequired,
  deployErrors: PropTypes.object
};

module.exports = FrameworkConfiguration;
