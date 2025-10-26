import React, { useState, useMemo, useEffect } from "react";
import { Icon } from "@iconify-icon/react/dist/iconify.js";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import type { Event, SlotInfo, ToolbarProps } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { enUS, es, fr, de, it, pt, ru, ja, ko, zhCN } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import ModalWrapper from "../ui/ModalWrapper";
import "@/styles/calendar.css";

interface Appointment {
  id: string;
  appointmentName: string;
  startTime: string;
  endTime: string;
  status: string;
  caseName: string;
  caseId: string;
}

interface CalendarEvent extends Event {
  resource: {
    caseName: string;
    caseId: string;
    status: string;
  };
}

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointments?: Appointment[];
}

// Get user's locale from browser
const getUserLocale = () => {
  const browserLocale =
    navigator.language || navigator.languages?.[0] || "en-US";
  return browserLocale;
};

// Map browser locales to date-fns locales
const getDateFnsLocale = (browserLocale: string) => {
  const localeMap: { [key: string]: any } = {
    en: enUS,
    "en-US": enUS,
    "en-GB": enUS,
    es: es,
    "es-ES": es,
    "es-MX": es,
    fr: fr,
    "fr-FR": fr,
    "fr-CA": fr,
    de: de,
    "de-DE": de,
    "de-AT": de,
    "de-CH": de,
    it: it,
    "it-IT": it,
    pt: pt,
    "pt-BR": pt,
    "pt-PT": pt,
    ru: ru,
    "ru-RU": ru,
    ja: ja,
    "ja-JP": ja,
    ko: ko,
    "ko-KR": ko,
    zh: zhCN,
    "zh-CN": zhCN,
    "zh-TW": zhCN,
  };

  // Try exact match first
  if (localeMap[browserLocale]) {
    return localeMap[browserLocale];
  }

  // Try language code only
  const languageCode = browserLocale.split("-")[0];
  if (localeMap[languageCode]) {
    return localeMap[languageCode];
  }

  // Fallback to English
  return enUS;
};

const userLocale = getUserLocale();
const dateFnsLocale = getDateFnsLocale(userLocale);

const locales = {
  [userLocale]: dateFnsLocale,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const CalendarModal: React.FC<CalendarModalProps> = ({
  isOpen,
  onClose,
  appointments = [],
}) => {
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const [isMobile, setIsMobile] = useState(false);
  const [currentView, setCurrentView] = useState<
    "month" | "week" | "day" | "agenda"
  >("month");

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Set default view based on screen size
  useEffect(() => {
    if (isMobile) {
      setCurrentView("agenda");
    } else {
      setCurrentView("month");
    }
  }, [isMobile]);

  // Convert appointments to react-big-calendar format
  const events = useMemo(() => {
    return appointments
      .filter(
        (appointment) =>
          appointment &&
          appointment.id &&
          appointment.startTime &&
          appointment.endTime
      )
      .map((appointment) => ({
        id: appointment.id,
        title: appointment.appointmentName || "Untitled Appointment",
        start: new Date(appointment.startTime),
        end: new Date(appointment.endTime),
        resource: {
          caseName: appointment.caseName || "Unknown Case",
          caseId: appointment.caseId || "",
          status: appointment.status || "Unknown",
        },
      }));
  }, [appointments]);

  // Custom event component for month view
  const MonthEventComponent = ({ event }: { event: CalendarEvent }) => {
    const startTime = toZonedTime(event.start || new Date(), userTimeZone);
    const endTime = toZonedTime(event.end || new Date(), userTimeZone);

    return (
      <div className="p-1 sm:p-1.5 md:p-2 bg-pink text-white rounded shadow-sm">
        {/* Time range */}
        <div className="font-semibold text-xs truncate opacity-90">
          {format(startTime, "h:mm a", { locale: dateFnsLocale })} -{" "}
          {format(endTime, "h:mm a", { locale: dateFnsLocale })}
        </div>

        {/* Event title */}
        <div className="text-xs font-medium truncate">
          {event.title || "Untitled Event"}
        </div>

        {/* Case name */}
        <div className="text-xs opacity-75 truncate">
          {event.resource?.caseName || "Unknown Case"}
        </div>
      </div>
    );
  };

  // Custom event component for week/day views
  const WeekDayEventComponent = ({ event }: { event: CalendarEvent }) => {
    const startTime = toZonedTime(event.start || new Date(), userTimeZone);
    const endTime = toZonedTime(event.end || new Date(), userTimeZone);

    return (
      <div className="p-2 bg-pink text-white rounded shadow-sm h-full flex flex-col justify-center">
        {/* Event title */}
        <div className="text-sm font-semibold truncate mb-1">
          {event.title || "Untitled Event"}
        </div>

        {/* Time range */}
        <div className="text-xs opacity-90 mb-1">
          {format(startTime, "h:mm a", { locale: dateFnsLocale })} -{" "}
          {format(endTime, "h:mm a", { locale: dateFnsLocale })}
        </div>

        {/* Case name */}
        <div className="text-xs opacity-75 truncate">
          {event.resource?.caseName || "Unknown Case"}
        </div>
      </div>
    );
  };

  // Custom event component for agenda view (mobile optimized)
  const AgendaEventComponent = ({ event }: { event: CalendarEvent }) => {
    const startTime = toZonedTime(event.start || new Date(), userTimeZone);
    const endTime = toZonedTime(event.end || new Date(), userTimeZone);

    return (
      <div className="p-3 bg-pink text-white rounded-lg shadow-sm">
        {/* Event title */}
        <div className="text-base font-semibold mb-2">
          {event.title || "Untitled Event"}
        </div>

        {/* Time and case info */}
        <div className="flex flex-col gap-1">
          <div className="text-sm opacity-90">
            {format(startTime, "h:mm a", { locale: dateFnsLocale })} -{" "}
            {format(endTime, "h:mm a", { locale: dateFnsLocale })}
          </div>
          <div className="text-sm opacity-75">
            {event.resource?.caseName || "Unknown Case"}
          </div>
        </div>
      </div>
    );
  };

  // Custom toolbar component for the calendar
  const CustomToolbar = (toolbar: ToolbarProps<CalendarEvent>) => {
    const goToToday = () => {
      toolbar.onNavigate("TODAY");
    };

    const goToPrevious = () => {
      toolbar.onNavigate("PREV");
    };

    const goToNext = () => {
      toolbar.onNavigate("NEXT");
    };

    const viewNames = {
      month: "Month",
      week: "Week",
      day: "Day",
      agenda: "Agenda",
    };

    const views = ["month", "week", "day", "agenda"];

    return (
      <div className="bg-white border-b border-gray-200 p-2 sm:p-3 md:p-4">
        {/* Mobile Layout - Agenda Only */}
        <div className="block md:hidden">
          <div className="flex flex-wrap items-center justify-between">
            {/* Left side - Navigation */}
            <div className="flex items-center gap-2">
              <button
                onClick={goToPrevious}
                className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                title="Previous"
              >
                <Icon
                  icon="mdi:chevron-left"
                  width="16"
                  height="16"
                  className="text-gray-600"
                />
              </button>
              <h3 className="text-sm font-semibold text-gray-800">
                {toolbar.label}
              </h3>
              <button
                onClick={goToNext}
                className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                title="Next"
              >
                <Icon
                  icon="mdi:chevron-right"
                  width="16"
                  height="16"
                  className="text-gray-600"
                />
              </button>
            </div>

            {/* Right side - Today button and count */}
            <div className="flex items-center gap-2">
              <button
                onClick={goToToday}
                className="px-3 py-1.5 bg-purple text-white rounded text-sm font-medium hover:bg-purple-dark transition-colors"
              >
                Today
              </button>
              <div className="text-sm text-gray-600">
                {appointments.length} appointments
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:flex items-center justify-between">
          {/* Left side - Today button and stats */}
          <div className="flex items-center gap-4">
            <button
              onClick={goToToday}
              className="px-4 py-2 bg-purple text-white rounded-lg hover:bg-purple-dark transition-colors font-medium text-sm"
            >
              Today
            </button>
            <div className="text-sm text-gray-600">
              {appointments.length} appointments
            </div>
          </div>

          {/* Center - Navigation */}
          <div className="flex items-center gap-3">
            <button
              onClick={goToPrevious}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Previous"
            >
              <Icon
                icon="mdi:chevron-left"
                width="20"
                height="20"
                className="text-gray-600"
              />
            </button>
            <h3 className="text-xl font-semibold text-gray-800 min-w-[120px] text-center">
              {toolbar.label}
            </h3>
            <button
              onClick={goToNext}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Next"
            >
              <Icon
                icon="mdi:chevron-right"
                width="20"
                height="20"
                className="text-gray-600"
              />
            </button>
          </div>

          {/* Right side - View buttons (desktop only) */}
          <div className="flex items-center">
            <div className="bg-gray-100 rounded-lg p-1 flex">
              {views.map((view) => (
                <button
                  key={view}
                  onClick={() => toolbar.onView(view as any)}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    toolbar.view === view
                      ? "bg-white text-purple shadow-sm"
                      : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                  }`}
                >
                  {viewNames[view as keyof typeof viewNames] || view}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="Calendar"
      widthClass="max-w-7xl !w-[95%] md:!w-full"
      noPadding={true}
    >
      <div className="h-[70vh] flex flex-col">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: "100%" }}
          view={currentView}
          onView={(view) => setCurrentView(view as any)}
          components={{
            toolbar: CustomToolbar,
            event: MonthEventComponent,
            week: {
              event: WeekDayEventComponent,
            },
            day: {
              event: WeekDayEventComponent,
            },
            agenda: {
              event: AgendaEventComponent,
            },
          }}
          eventPropGetter={() => ({
            style: {
              backgroundColor: "#b83484", // pink color
              border: "none",
              borderRadius: "3px",
              color: "white",
              padding: "1px",
              boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
              fontSize: "11px",
              lineHeight: "1.2",
            },
          })}
          views={isMobile ? ["agenda"] : ["month", "week", "day", "agenda"]}
          defaultView={isMobile ? "agenda" : "month"}
          step={60}
          timeslots={1}
          selectable
          popup
          culture={userLocale}
          onSelectEvent={(event: CalendarEvent) => {
            console.log("Selected event:", event);
            // You can add navigation to appointment details here
          }}
          onSelectSlot={(slotInfo: SlotInfo) => {
            console.log("Selected slot:", slotInfo);
            // You can add new appointment creation here
          }}
        />
      </div>
    </ModalWrapper>
  );
};

export default CalendarModal;
