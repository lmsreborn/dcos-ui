const DEFAULT_POD_RESOURCES = {cpus: 0.001, mem: 32};
const DEFAULT_POD_CONTAINER =
    {name: 'container-1', resources: DEFAULT_POD_RESOURCES};
const DEFAULT_POD_SPEC = {containers: [DEFAULT_POD_CONTAINER]};

module.exports = {
  DEFAULT_POD_CONTAINER,
  DEFAULT_POD_RESOURCES,
  DEFAULT_POD_SPEC
};