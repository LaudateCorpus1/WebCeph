import {
  connect,
  MapStateToProps,
  MapDispatchToPropsFunction,
  MergeProps,
} from 'react-redux';

import App from './index';
import {
  StateProps,
  DispatchProps,
  OwnProps,
  ConnectableProps,
} from './props';

import {
  isAppInitialized,
} from 'store/reducers/app';

import {
  isCompatibilityIgnored,
  isCheckingCompatiblity,
  isBrowserCompatible,
} from 'store/reducers/env/compat';

import {
  restorePersistedState,
} from 'actions/persistence';

import {
  isSummaryShown,
  canShowSummary,
} from 'store/reducers/workspace/analyses';

import {
  checkBrowserCompatibility,
} from 'actions/initialization';

import { connectionStatusChanged } from 'actions/env';

const mapStateToProps: MapStateToProps<StateProps, OwnProps> =
  (state: StoreState, { userAgent }: OwnProps) => {
    return {
      isSummaryShown: canShowSummary(state) && isSummaryShown(state),
      isReady: isAppInitialized(state),
      shouldCheckCompatibility: !(
        isBrowserCompatible(state)(userAgent) ||
        isCompatibilityIgnored(state) ||
        isCheckingCompatiblity(state)
      ),
    };
  };

const mapDispatchToProps: MapDispatchToPropsFunction<DispatchProps, OwnProps> =
  (dispatch) => (
    {
      dispatch,
    }
  );

const mergeProps: MergeProps<StateProps, DispatchProps, OwnProps> =
  (stateProps, dispatchProps, ownProps): ConnectableProps => {
    const { dispatch } = dispatchProps;
    const { isReady, shouldCheckCompatibility } = stateProps;
    return {
      ...stateProps,
      ...dispatchProps,
      ...ownProps,
      onComponentMount: () => {
        if (!isReady) {
          dispatch(restorePersistedState(void 0));
        }
        if (shouldCheckCompatibility) {
          dispatch(checkBrowserCompatibility(void 0));
        }
        dispatch(connectionStatusChanged({ isOffline: !navigator.onLine }));
      },
    };
  };

const connected = connect<StateProps, DispatchProps, OwnProps>(
  mapStateToProps, mapDispatchToProps, mergeProps,
)(App);

export default connected;