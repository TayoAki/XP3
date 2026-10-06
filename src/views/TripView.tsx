import { useState } from "react";
import {
  ArrowLeft,
  BedDouble,
  CalendarDays,
  Check,
  Copy,
  Download,
  History,
  Lightbulb,
  ListChecks,
  MoreHorizontal,
  Plane,
  Plus,
  Share2,
  Archive,
  Undo2,
  CalendarOff,
  Navigation,
  Trash2,
} from "lucide-react";
import { useApp } from "../app/context";
import { dateLabel, getPlace, places, type Trip } from "../model";
import type { TripTab } from "../routes";
import { tripIdeas, removeFromCollection } from "../collections";
import { stayEstimate } from "../tripLogic";
import { Button, IconButton, Menu } from "../ui";
import { ContextSidebar, NavList, PageHeader } from "../shell/Shell";
import TripChat from "../components/trip/TripChat";
import NewTrip from "../components/trip/NewTrip";
import RouteMap from "../components/RouteMap";
import { Photo } from "../components/PlaceCard";

const tabs = [
  ["itinerary", "Itinerary"],
  ["ideas", "Ideas"],
  ["bookings", "Bookings"],
] as const;

export function TripView({ onOpenContext }: { onOpenContext: () => void }) {
  const app = useApp();
  const { loc, trip } = app;
  if (loc.route.view !== "trip") return null;
  const route = loc.route;
  if (route.id === "new" || !trip)
    return (
      <div className="workspace">
        <div className="workspace-head">
          <PageHeader
            title={route.id === "new" ? "New trip" : "Trip not found"}
            subtitle={
              route.id === "new"
                ? undefined
                : "This trip isn’t on this device. It may have been reset."
            }
            leading={
              <IconButton
                label="All trips"
                onClick={() => app.go({ view: "trips", tab: "upcoming" }, null)}
              >
                <ArrowLeft size={20} />
              </IconButton>
            }
          />
        </div>
        <NewTrip />
      </div>
    );
  const setTab = (tab: TripTab) => app.go({ view: "trip", id: trip.id, tab });
  const status = trip.status;
  return (
    <div className="workspace">
      <div className="workspace-head">
        <PageHeader
          title={trip.name}
          subtitle={
            <button
              className="brief-chip"
              onClick={() => app.openModal("edit-brief")}
            >
              <CalendarDays size={14} />
              {dateLabel(trip.brief.start)}–{dateLabel(trip.brief.end)} ·{" "}
              {trip.brief.travelers} travelers · {trip.brief.pace} · $
              {trip.brief.budget}/night
            </button>
          }
          tabs={tabs}
          tab={route.tab}
          onTab={setTab}
          onOpenContext={onOpenContext}
          actions={
            <>
              <Button size="sm" onClick={() => app.openModal("share")}>
                <Share2 size={16} />
                <span className="btn-label">Share</span>
              </Button>
              <IconButton
                label="Change history"
                onClick={() => app.openModal("history")}
              >
                <History size={18} />
              </IconButton>
              <Menu
                label="Trip options"
                trigger={<MoreHorizontal size={20} />}
                items={[
                  {
                    label: "Edit the brief",
                    icon: <ListChecks size={16} />,
                    onSelect: () => app.openModal("edit-brief"),
                  },
                  {
                    label: "Travel mode (today’s plan)",
                    icon: <Navigation size={16} />,
                    onSelect: () => app.openModal("today"),
                  },
                  {
                    label: "Download as text",
                    icon: <Download size={16} />,
                    onSelect: app.exportTrip,
                  },
                  {
                    label: "Continue without dates",
                    icon: <CalendarOff size={16} />,
                    onSelect: () => removeDates(app, trip),
                  },
                  ...(trip.conversion
                    ? [
                        {
                          label: "Return scheduled ideas to their collection",
                          icon: <Undo2 size={16} />,
                          onSelect: () => undoConversion(app, trip),
                        },
                      ]
                    : []),
                  ...(status === "planning" || status === "traveling"
                    ? [
                        {
                          label: "Mark as completed",
                          icon: <Check size={16} />,
                          onSelect: () => setStatus(app, trip, "complete"),
                        },
                        {
                          label: "Archive",
                          icon: <Archive size={16} />,
                          onSelect: () => setStatus(app, trip, "archived"),
                        },
                      ]
                    : [
                        {
                          label: "Restore to planning",
                          icon: <Undo2 size={16} />,
                          onSelect: () => setStatus(app, trip, "planning"),
                        },
                      ]),
                  {
                    label: "Reuse as a new trip",
                    icon: <Copy size={16} />,
                    onSelect: () => reuse(app, trip),
                  },
                ]}
              />
            </>
          }
        />
      </div>
      {route.tab === "itinerary" && <TripChat trip={trip} />}
      {route.tab === "ideas" && <TripIdeas trip={trip} />}
      {route.tab === "bookings" && <TripBookings trip={trip} />}
    </div>
  );
}

type Api = ReturnType<typeof useApp>;

function setStatus(app: Api, trip: Trip, status: Trip["status"]) {
  app.setState((s) => ({
    ...s,
    trips: s.trips.map((t) =>
      t.id === trip.id ? { ...t, status, updatedAt: Date.now() } : t,
    ),
  }));
  app.notify(
    status === "complete"
      ? "Marked as completed."
      : status === "archived"
        ? "Trip archived."
        : "Back in planning.",
    status === "planning"
      ? undefined
      : { label: "Undo", run: () => setStatus(app, trip, trip.status) },
  );
}

function reuse(app: Api, trip: Trip) {
  const copy = structuredClone(trip);
  copy.id = crypto.randomUUID();
  copy.status = "planning";
  copy.name = trip.name + " · again";
  copy.updatedAt = Date.now();
  copy.visited = [];
  app.setState((s) => ({ ...s, trips: [copy, ...s.trips] }));
  app.go({ view: "trip", id: copy.id, tab: "itinerary" }, null);
  app.notify("Copied into a new trip. The original is unchanged.");
}

function removeDates(app: Api, trip: Trip) {
  const id = crypto.randomUUID();
  app.setState((s) => ({
    ...s,
    collections: [
      ...(s.collections || []),
      {
        id,
        name: trip.name + " · undated",
        placeIds: [...new Set(trip.days.flatMap((d) => d.places))],
        note: "Converted from a dated trip. The original day order is kept below.",
        dayGroups: structuredClone(trip.days),
        sourceTripId: trip.id,
      },
    ],
    trips: s.trips.map((t) =>
      t.id === trip.id ? { ...t, status: "archived" } : t,
    ),
  }));
  app.go({ view: "saved", collection: id }, null);
  app.notify(
    "Now an undated collection. The dated version is in Trips → Past.",
  );
}

function undoConversion(app: Api, trip: Trip) {
  const conversion = trip.conversion!;
  app.setState((s) => ({
    ...s,
    collections: s.collections?.map((c) =>
      c.id === conversion.collectionId
        ? {
            ...c,
            placeIds: [...new Set([...c.placeIds, ...conversion.placeIds])],
          }
        : c,
    ),
    trips: s.trips.map((t) =>
      t.id === trip.id
        ? { ...t, status: "archived", conversion: undefined }
        : t,
    ),
  }));
  app.go({ view: "saved", collection: conversion.collectionId }, null);
  app.notify(
    "Ideas are back in their collection. The trip is in Trips → Past.",
  );
}

function TripIdeas({ trip }: { trip: Trip }) {
  const app = useApp();
  const ideas = tripIdeas(app.state, trip.id);
  return (
    <div className="tab-scroll">
      <div className="page tab-page">
        <p className="lead">
          Undated places for this trip. Anything you swap out or move off a day
          lands here, so nothing is lost.
        </p>
        {ideas.placeIds.length ? (
          <>
            <RouteMap
              ids={ideas.placeIds}
              onSelect={(id) => app.openPanel({ kind: "place", id })}
            />
            <ul className="idea-list">
              {ideas.placeIds.map((id) => {
                const p = getPlace(id);
                return (
                  <li key={id} className="idea-row">
                    <button
                      className="idea-main"
                      onClick={() => app.openPanel({ kind: "place", id })}
                    >
                      <span className="idea-thumb">
                        <Photo place={p} />
                      </span>
                      <span>
                        <strong>{p.name}</strong>
                        <small>
                          {p.area} · {p.duration} · {p.price}
                        </small>
                      </span>
                    </button>
                    <div className="idea-actions">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() =>
                          app.setMode({ kind: "placing", placeId: id })
                        }
                      >
                        <Plus size={16} /> Add to a day
                      </Button>
                      <IconButton
                        label={`Remove ${p.name} from ideas`}
                        onClick={() => {
                          app.setState((s) =>
                            removeFromCollection(s, ideas.id, id),
                          );
                          app.notify(`${p.name} removed from ideas.`, {
                            label: "Undo",
                            run: () =>
                              app.setState((s) => ({
                                ...s,
                                collections: s.collections?.map((c) =>
                                  c.id === ideas.id
                                    ? { ...c, placeIds: [...c.placeIds, id] }
                                    : c,
                                ),
                              })),
                          });
                        }}
                      >
                        <Trash2 size={18} />
                      </IconButton>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        ) : (
          <div className="empty">
            <Lightbulb size={28} />
            <h2>No ideas for this trip yet</h2>
            <p>
              Browse places and save the ones you might fit in. Swapped-out
              stops also land here.
            </p>
            <Button
              variant="primary"
              onClick={() => app.go({ view: "discover", tab: "places" }, null)}
            >
              Browse places
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function TripBookings({ trip }: { trip: Trip }) {
  const app = useApp();
  const [name, setName] = useState("");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const stay = trip.stayId ? getPlace(trip.stayId) : undefined;
  const est = stay ? stayEstimate(stay, trip) : undefined;
  return (
    <div className="tab-scroll">
      <div className="page tab-page">
        <section className="booking-stay" aria-labelledby="base-title">
          <BedDouble size={20} />
          <div>
            <h2 id="base-title">Your base</h2>
            {stay && est ? (
              <p>
                {stay.name} · about ${est.total.toLocaleString()} for{" "}
                {est.nights} nights incl. estimated taxes. Chosen, not booked.
              </p>
            ) : (
              <p>No stay chosen yet.</p>
            )}
          </div>
          <Button
            size="sm"
            onClick={() =>
              app.openPanel({
                kind: "place",
                id: stay?.id || places.find((p) => p.kind === "stay")!.id,
              })
            }
          >
            {stay ? "Compare stays" : "Choose a stay"}
          </Button>
        </section>
        <h2 className="section-title">Reservations</h2>
        {trip.bookings.length ? (
          <ul className="booking-list">
            {trip.bookings.map((b, i) => (
              <li key={i}>
                <Plane size={18} />
                <div>
                  <strong>{b.name}</strong>
                  <small>
                    {b.reference}
                    {b.note ? ` · ${b.note}` : ""}
                  </small>
                </div>
                <IconButton
                  label={`Remove ${b.name}`}
                  onClick={() =>
                    app.changeTrip("Reservation removed.", (t) => {
                      t.bookings.splice(i, 1);
                    })
                  }
                >
                  <Trash2 size={18} />
                </IconButton>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted-note">
            No reservations yet. Add them as you book, so they’re in one place.
          </p>
        )}
        <form
          className="booking-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim() || !reference.trim()) return;
            app.changeTrip("Reservation added.", (t) => {
              t.bookings.push({
                name: name.trim(),
                reference: reference.trim(),
                note: note.trim(),
              });
            });
            setName("");
            setReference("");
            setNote("");
          }}
        >
          <h3>Add a reservation</h3>
          <label>
            Name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. The Gage, 7:30pm table"
              required
            />
          </label>
          <label>
            Confirmation number
            <input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              required
            />
          </label>
          <label>
            Notes
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Times, check-in details…"
            />
          </label>
          <p className="muted-note">
            Typed in by you. Email and document import aren’t connected in this
            preview.
          </p>
          <Button type="submit" variant="primary">
            <Plus size={16} /> Add reservation
          </Button>
        </form>
      </div>
    </div>
  );
}

export function TripSidebar() {
  const app = useApp();
  const { loc, trip } = app;
  if (loc.route.view !== "trip") return null;
  const route = loc.route;
  return (
    <ContextSidebar
      title={trip ? trip.name : "New trip"}
      action={
        <Button
          size="sm"
          variant="ghost"
          onClick={() => app.go({ view: "trips", tab: "upcoming" }, null)}
        >
          <ArrowLeft size={16} /> All trips
        </Button>
      }
    >
      {trip ? (
        <>
          <NavList
            label="Days"
            items={[
              {
                id: "all",
                label: "All days",
                meta: `${trip.days.length} days`,
                active: route.tab === "itinerary" && !route.day,
                onSelect: () =>
                  app.go({ view: "trip", id: trip.id, tab: "itinerary" }),
              },
              ...trip.days.map((d, i) => ({
                id: d.id,
                label: `Day ${i + 1} · ${d.title}`,
                meta: `${d.places.length} stops`,
                active: route.tab === "itinerary" && route.day === d.id,
                onSelect: () =>
                  app.go({
                    view: "trip",
                    id: trip.id,
                    tab: "itinerary",
                    day: d.id,
                  }),
              })),
            ]}
          />
          <h3>More</h3>
          <NavList
            label="Trip sections"
            items={[
              {
                id: "ideas",
                label: "Unscheduled ideas",
                meta: `${tripIdeas(app.state, trip.id).placeIds.length} places`,
                icon: <Lightbulb size={18} />,
                active: route.tab === "ideas",
                onSelect: () =>
                  app.go({ view: "trip", id: trip.id, tab: "ideas" }),
              },
              {
                id: "bookings",
                label: "Bookings",
                meta: `${trip.bookings.length} saved`,
                icon: <Plane size={18} />,
                active: route.tab === "bookings",
                onSelect: () =>
                  app.go({ view: "trip", id: trip.id, tab: "bookings" }),
              },
            ]}
          />
        </>
      ) : (
        <p className="muted-note sidebar-note">
          Describe the trip to get started.
        </p>
      )}
    </ContextSidebar>
  );
}
