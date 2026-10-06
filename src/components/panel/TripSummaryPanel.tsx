import {
  CalendarDays,
  Users,
  BedDouble,
  Wallet,
  Gauge,
  CircleAlert,
  Check,
} from "lucide-react";
import { useApp } from "../../app/context";
import { dateLabel, getPlace, type Trip } from "../../model";
import { stayEstimate } from "../../tripLogic";
import { openDecisions } from "../../views/TripsView";
import { Button } from "../../ui";
import RouteMap from "../RouteMap";

/** What the side panel shows inside a trip when nothing is selected (wide screens). */
export default function TripSummaryPanel({ trip }: { trip: Trip }) {
  const app = useApp();
  const decisions = openDecisions(trip, app.state);
  const stay = trip.stayId ? getPlace(trip.stayId) : undefined;
  const est = stay ? stayEstimate(stay, trip) : undefined;
  const ids = trip.days.flatMap((d) => d.places);
  return (
    <aside className="side-panel is-summary" aria-label="Trip summary">
      <header className="side-panel-head">
        <div className="side-panel-title">
          <h2>Trip summary</h2>
          <p>Select any place to research it here.</p>
        </div>
      </header>
      <div className="side-panel-body">
        <RouteMap
          ids={[...ids, ...(stay ? [stay.id] : [])]}
          onSelect={(id) => app.openPanel({ kind: "place", id })}
          small
        />
        <dl className="summary-facts">
          <div>
            <dt>
              <CalendarDays size={16} /> Dates
            </dt>
            <dd>
              {dateLabel(trip.brief.start)}–{dateLabel(trip.brief.end)} ·{" "}
              {trip.days.length} days
            </dd>
          </div>
          <div>
            <dt>
              <Users size={16} /> Travelers
            </dt>
            <dd>{trip.brief.travelers}</dd>
          </div>
          <div>
            <dt>
              <Gauge size={16} /> Pace
            </dt>
            <dd>{trip.brief.pace}</dd>
          </div>
          <div>
            <dt>
              <Wallet size={16} /> Hotel target
            </dt>
            <dd>${trip.brief.budget}/night</dd>
          </div>
          <div>
            <dt>
              <BedDouble size={16} /> Base
            </dt>
            <dd>
              {stay && est
                ? `${stay.name} · ≈ $${est.total.toLocaleString()}`
                : "Not chosen"}
            </dd>
          </div>
        </dl>
        <Button size="sm" full onClick={() => app.openModal("edit-brief")}>
          Edit the brief
        </Button>
        <h3 className="section-title">Still to decide</h3>
        {decisions.length ? (
          <ul className="decision-list">
            {decisions.map((d) => (
              <li key={d}>
                <CircleAlert size={14} /> {d}
              </li>
            ))}
          </ul>
        ) : (
          <p className="ready-line">
            <Check size={16} /> Nothing left to decide
          </p>
        )}
      </div>
    </aside>
  );
}
