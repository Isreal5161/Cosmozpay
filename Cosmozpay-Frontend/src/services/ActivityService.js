// Simple Activity service to allow non-component code to record activities
let _setActivities = null;
let _addActivityFn = null;
let _inMemory = [];

export function registerSetActivities(setter) {
  _setActivities = setter;
}

export function registerAddActivity(fn) {
  _addActivityFn = fn;
}

export function addActivity(activity) {
  if (typeof _addActivityFn === 'function') {
    try {
      _addActivityFn(activity);
      return;
    } catch (e) {
      // fallthrough to setter fallback
    }
  }

  if (typeof _setActivities === 'function') {
    try {
      _setActivities((prev) => [activity, ...(prev || [])]);
      return;
    } catch (e) {
      // fallthrough to in-memory fallback
    }
  }
  // Fallback store until the app registers a setter
  _inMemory = [activity, ..._inMemory];
}

export function getPendingActivities() {
  return _inMemory.slice();
}

export function clearPendingActivities() {
  _inMemory = [];
}

export default { registerSetActivities, addActivity, getPendingActivities, clearPendingActivities };
