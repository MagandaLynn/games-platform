import { pctFromDistance, tempTrendFromDistances, trendStyle, trendText } from "../helpers/helpers";
import { GuessFeedback } from "../helpers/types";

export default function Distance({feedbackHistory}: {feedbackHistory: GuessFeedback[]}) {
    const lastFb = feedbackHistory[feedbackHistory.length - 1];
    const prevFb = feedbackHistory[feedbackHistory.length - 2];

    const currDist = lastFb?.distance;
    const prevDist = prevFb?.distance;

    const { trend, deltaAbs } = tempTrendFromDistances(prevDist, currDist);


    const lastDistance = lastFb?.distance;
    const delta =
    lastDistance != null && prevFb?.distance != null
        ? prevFb.distance - lastDistance // positive means closer
        : null;
    return (
        <>
        {typeof currDist === "number" && (
  <div style={{ marginTop: 10 }}>
    <div style={{ display: "flex", gap: 12, alignItems: "baseline" }}>
      <div style={{ fontWeight: 800 }}>
        Distance: {currDist.toFixed(1)}
      </div>

      <div style={trendStyle(trend)}>
        {trendText(trend, deltaAbs)}
      </div>
    </div>

    <div style={{ marginTop: 6, fontSize: 12, opacity: 0.7 }}>
      0 is perfect match
    </div>
  </div>
)}

        </>)
}
