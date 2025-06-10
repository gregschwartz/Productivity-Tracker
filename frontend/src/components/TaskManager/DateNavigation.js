import React from 'react';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import ReactCalendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { NavButton, TodayButton } from '../buttons';
import { 
  DateNavigation as StyledDateNavigation, 
  DateNavHeader, 
  CurrentDateDisplay, 
  DateNavControls, 
  DateNavButtons 
} from './TaskManager.styles';

/**
 * DateNavigation component for date selection and navigation
 */
function DateNavigation({
  currentDate,
  isToday,
  showDatePicker,
  setShowDatePicker,
  handlePreviousDay,
  handleNextDay,
  handleToday,
  handleCalendarChange,
  theme
}) {
  return (
    <StyledDateNavigation $theme={theme}>
      <DateNavHeader>
        <CurrentDateDisplay $theme={theme}>
          {format(currentDate, 'EEEE, MMMM dd, yyyy')}
        </CurrentDateDisplay>
        <DateNavControls>
          <DateNavButtons>
            <NavButton onClick={handlePreviousDay} title="Previous day" $theme={theme}>
              <ChevronLeft />
            </NavButton>
            <TodayButton 
              onClick={handleToday} 
              $isToday={isToday}
              $theme={theme}
              title="Go to today"
            >
              Today
            </TodayButton>
            <NavButton onClick={handleNextDay} title="Next day" $theme={theme}>
              <ChevronRight />
            </NavButton>
          </DateNavButtons>
          <div style={{ position: 'relative' }}>
            <NavButton 
              onClick={() => setShowDatePicker(!showDatePicker)}
              title="Jump to date"
              $theme={theme}
            >
              <Calendar />
            </NavButton>
            {showDatePicker && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                zIndex: 10,
                marginTop: '4px',
                background: 'white',
                border: '1px solid #ccc',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
              }}>
                <ReactCalendar
                  value={currentDate}
                  onChange={handleCalendarChange}
                  calendarType="iso8601"
                />
              </div>
            )}
          </div>
        </DateNavControls>
      </DateNavHeader>
    </StyledDateNavigation>
  );
}

export default DateNavigation;