// Google Calendar Service for managing calendar integration
import { google } from 'googleapis';

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.readonly'
];

export class GoogleCalendarService {
  constructor(accessToken) {
    this.accessToken = accessToken;
    this.calendar = google.calendar({
      version: 'v3',
      auth: this.getAuthClient()
    });
  }

  getAuthClient() {
    const { OAuth2 } = google.auth;
    const oauth2Client = new OAuth2(
      process.env.VITE_GOOGLE_CLIENT_ID,
      '', // No client secret needed for frontend
      'http://localhost:5173' // Redirect URI
    );

    oauth2Client.setCredentials({
      access_token: this.accessToken
    });

    return oauth2Client;
  }

  /**
   * Buscar eventos do calendário Google
   * @param {string} calendarId - ID do calendário (default: 'primary')
   * @param {Object} options - Opções de filtro
   */
  async getEvents(calendarId = 'primary', options = {}) {
    try {
      const response = await this.calendar.events.list({
        calendarId,
        timeMin: options.timeMin || new Date().toISOString(),
        timeMax: options.timeMax,
        maxResults: options.maxResults || 10,
        singleEvents: true,
        orderBy: 'startTime'
      });

      return response.data.items || [];
    } catch (error) {
      console.error('Erro ao buscar eventos:', error);
      throw error;
    }
  }

  /**
   * Criar evento no calendário Google
   * @param {Object} event - Objeto do evento
   * @param {string} calendarId - ID do calendário (default: 'primary')
   */
  async createEvent(event, calendarId = 'primary') {
    try {
      const response = await this.calendar.events.insert({
        calendarId,
        resource: event
      });

      return response.data;
    } catch (error) {
      console.error('Erro ao criar evento:', error);
      throw error;
    }
  }

  /**
   * Buscar datas ocupadas (busy times) para sincronização
   * @param {Array<string>} dates - Array de datas para verificar
   */
  async getBusyTimes(dates) {
    try {
      const timeMin = dates[0] ? new Date(dates[0]).toISOString() : new Date().toISOString();
      const timeMax = dates[dates.length - 1] ? new Date(dates[dates.length - 1]).toISOString() : new Date(new Date().setDate(new Date().getDate() + 30)).toISOString();

      const response = await this.calendar.freebusy.query({
        resource: {
          timeMin,
          timeMax,
          items: [{ id: 'primary' }]
        }
      });

      return response.data.calendars.primary.busy || [];
    } catch (error) {
      console.error('Erro ao buscar horários ocupados:', error);
      throw error;
    }
  }

  /**
   * Excluir evento do calendário
   * @param {string} eventId - ID do evento
   * @param {string} calendarId - ID do calendário (default: 'primary')
   */
  async deleteEvent(eventId, calendarId = 'primary') {
    try {
      await this.calendar.events.delete({
        calendarId,
        eventId
      });
      return true;
    } catch (error) {
      console.error('Erro ao deletar evento:', error);
      throw error;
    }
  }

  /**
   * Atualizar evento no calendário
   * @param {string} eventId - ID do evento
   * @param {Object} event - Dados atualizados do evento
   * @param {string} calendarId - ID do calendário (default: 'primary')
   */
  async updateEvent(eventId, event, calendarId = 'primary') {
    try {
      const response = await this.calendar.events.update({
        calendarId,
        eventId,
        resource: event
      });

      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar evento:', error);
      throw error;
    }
  }
}

/**
 * Criar objeto de evento para Google Calendar
 */
export function createCalendarEvent({
  title,
  description,
  startTime,
  endTime,
  location,
  colorId
}) {
  return {
    summary: title,
    description: description || '',
    location: location || '',
    start: {
      dateTime: new Date(startTime).toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    },
    end: {
      dateTime: new Date(endTime).toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    },
    colorId: colorId || '1', // 1 = tomato (red)
    transparency: 'opaque',
    eventType: 'default'
  };
}

/**
 * Converter data para evento "busy" (bloquear horário todo)
 */
export function createBusyEvent({
  date,
  description = 'Indisponível'
}) {
  const startDate = new Date(date);
  const endDate = new Date(date);
  endDate.setDate(endDate.getDate() + 1);

  return {
    summary: description,
    description: 'Bloqueado via TóCamais',
    start: {
      date: date
    },
    end: {
      date: endDate.toISOString().split('T')[0]
    },
    colorId: '4', // 4 = flamingo (red/pink)
    transparency: 'transparent',
    eventType: 'default',
    extendedProperties: {
      private: {
        tocamaisBlocked: 'true'
      }
    }
  };
}
