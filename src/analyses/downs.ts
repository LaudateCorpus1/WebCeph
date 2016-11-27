import assign from 'lodash/assign';

import {
  angleBetweenPoints,
  line, angleBetweenLines,
  SkeletalProfile, ProblemSeverity,
  MandibularRotation,
  Mandible,
} from 'analyses/helpers';

import common, {
  components as commonComponents,
} from 'analyses/common';

import {
  N, Pog, A, B,
} from 'analyses/landmarks/points';

import {
  ANGLE_OF_Y_AXIS,
} from 'analyses/landmarks/angles';

import {
  FH_PLANE,
} from 'analyses/landmarks/lines';

import { radiansToDegrees, calculateAngleBetweenTwoVectors } from 'utils/math';

const ANGLE_OF_CONVEXITY: CephaloAngle = assign(
   angleBetweenPoints(N, A, Pog, 'Angle of Convexity'),
   {
     calculate: (mapper: CephaloMapper, NA: GeometricalVector, APog: GeometricalVector) => {
       const _A = { x: NA.x1, y: NA.y1 };
       const _N = { x: NA.x2, y: NA.y2 };
       const _Pog = { x: APog.x2, y: APog.y2 };
       const _NPog = { x1: _N.x, y1: _N.y, x2: _Pog.x, y2: _Pog.y };
       const positiveValue = Math.abs(radiansToDegrees(Math.PI - calculateAngleBetweenTwoVectors(NA, APog)));
       if (mapper.isBehind(_A, _NPog)) {
         return -1 * positiveValue;
       } else {
         return positiveValue;
       }
     },
   },
);

const AB_PLANE_ANGLE: CephaloAngle = assign(
  angleBetweenLines(line(B, A), line(Pog, N), 'A-B Plane Angle'),
  {
    calculate(mapper: CephaloMapper, lineBA: GeometricalVector, linePogN: GeometricalVector) {
      const A = { x: lineBA.x2, y: lineBA.y2 };
      const positiveValue = Math.abs(radiansToDegrees(calculateAngleBetweenTwoVectors(lineBA, linePogN)));
      if (!mapper.isBehind(A, linePogN)) {
        return -1 * positiveValue;
      }
      return positiveValue;
    },
  },
);

const interpretAngleOfConvexity = (value: number, min = -5, max = 5): AnalysisInterpretation => {
  // @TODO: handle severity
  const relevantComponents = [ANGLE_OF_CONVEXITY.symbol];
  let severity = ProblemSeverity.NONE;
  let indication = SkeletalProfile.normal;
  if (value < min) {
    indication = SkeletalProfile.concave;
    severity = Math.max(
      ProblemSeverity.HIGH,
      Math.round(Math.abs(value - min) / 3),
    );
  } else if (value > max) {
    indication = SkeletalProfile.convex;
    severity = Math.min(
      ProblemSeverity.HIGH,
      Math.round(Math.abs(value - max) / 3),
    );
  }
  return {
    indication,
    severity,
    relevantComponents,
  };
};

const interpretAngleOfYAxis = (value: number, min = -55.6, max = 63.2): AnalysisInterpretation => {
  // @TODO: handle severity
  const relevantComponents = [ANGLE_OF_Y_AXIS.symbol];
  let severity = ProblemSeverity.NONE;
  let indication = MandibularRotation.normal;
  if (value < min) {
    indication = MandibularRotation.counterClockwise;
    severity = Math.max(
      ProblemSeverity.HIGH,
      Math.round(Math.abs(value - min) / 3),
    );
  } else if (value > max) {
    indication = MandibularRotation.clockwise;
    severity = Math.min(
      ProblemSeverity.HIGH,
      Math.round(Math.abs(value - max) / 3),
    );
  }
  return {
    indication,
    severity,
    relevantComponents,
  };
};

const interpretValueOfABPlaneAngle = (value: number, min = -9.2, max = 0): AnalysisInterpretation => {
  // @TODO: handle severity
  const relevantComponents = [AB_PLANE_ANGLE.symbol];
  let severity = ProblemSeverity.NONE;
  let indication = Mandible.normal;
  if (value < min) {
    indication = Mandible.retrognathic;
    severity = Math.max(
      ProblemSeverity.HIGH,
      Math.round(Math.abs(value - min) / 3),
    );
  } else if (value > max) {
    indication = Mandible.prognathic;
    severity = Math.min(
      ProblemSeverity.HIGH,
      Math.round(Math.abs(value - max) / 3),
    );
  }
  return {
    indication,
    severity,
    relevantComponents,
  };
};

export const angleOfConvexity: AnalysisComponent = {
  landmark: ANGLE_OF_CONVEXITY,
  norm: 0,
  stdDev: 5.1,
};

export const angleOfYAxis: AnalysisComponent = {
  landmark: ANGLE_OF_Y_AXIS,
  norm: 59.4,
  stdDev: 3.8,
};

export const angleOfABPlane: AnalysisComponent = {
  landmark: AB_PLANE_ANGLE,
  norm: -4.6,
  stdDev: 4.6,
};

const components: AnalysisComponent[] = [
  ...commonComponents,
  angleOfConvexity,
  angleOfYAxis,
  angleOfABPlane,
  {
    landmark: angleBetweenLines(FH_PLANE, line(Pog, N), 'Facial Angle', 'FH-NPog'),
    norm: 87.8,
    stdDev: 3.6,
  },
];

export const interpret = (values: { [id: string]: EvaluatedValue }) => {
  const results: AnalysisInterpretation[] = common.interpret(values);
  // @TODO
  const valueOfAngleOfConexity = values[ANGLE_OF_CONVEXITY.symbol];
  if (typeof valueOfAngleOfConexity === 'number') {
    results.push(
      interpretAngleOfConvexity(valueOfAngleOfConexity),
    );
  }

  const valueOfAngleOfYAxis = values[ANGLE_OF_Y_AXIS.symbol];
  if (typeof valueOfAngleOfYAxis === 'number') {
    results.push(
      interpretAngleOfYAxis(valueOfAngleOfYAxis),
    );
  }

  const valueOfABPlangeAngle = values[AB_PLANE_ANGLE.symbol];
  if (typeof valueOfABPlangeAngle === 'number') {
    results.push(
      interpretValueOfABPlaneAngle(valueOfABPlangeAngle),
    );
  }
  return results;
};

const analysis: Analysis = {
  id: 'downs',
  components,
  interpret,
};

export default analysis;
