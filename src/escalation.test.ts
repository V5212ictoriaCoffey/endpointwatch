import {
  createEscalationState,
  recordEscalation,
  resetEscalation,
  isEscalated,
  escalationSummary,
  EscalationRule,
} from './escalation';

const rules: EscalationRule[] = [
  { level: 'critical', afterCount: 3, notifyChannels: ['slack', 'email'] },
  { level: 'warn', afterCount: 5, notifyChannels: ['slack'] },
];

describe('escalation', () => {
  it('does not escalate below threshold', () => {
    const state = createEscalationState();
    const result = recordEscalation(state, 'ep1', 'critical', rules);
    expect(result.escalated).toBe(false);
    expect(result.count).toBe(1);
  });

  it('escalates at threshold', () => {
    const state = createEscalationState();
    recordEscalation(state, 'ep1', 'critical', rules);
    recordEscalation(state, 'ep1', 'critical', rules);
    const result = recordEscalation(state, 'ep1', 'critical', rules);
    expect(result.escalated).toBe(true);
    expect(result.channels).toContain('slack');
    expect(result.channels).toContain('email');
  });

  it('does not escalate wrong level', () => {
    const state = createEscalationState();
    for (let i = 0; i < 3; i++) recordEscalation(state, 'ep1', 'warn', rules);
    const result = recordEscalation(state, 'ep1', 'warn', rules);
    expect(result.escalated).toBe(false);
  });

  it('resets escalation state', () => {
    const state = createEscalationState();
    for (let i = 0; i < 3; i++) recordEscalation(state, 'ep1', 'critical', rules);
    expect(isEscalated(state, 'ep1')).toBe(true);
    resetEscalation(state, 'ep1');
    expect(isEscalated(state, 'ep1')).toBe(false);
  });

  it('summary with no entries', () => {
    const state = createEscalationState();
    expect(escalationSummary(state)).toMatch(/No escalations/);
  });

  it('summary with entries', () => {
    const state = createEscalationState();
    recordEscalation(state, 'ep1', 'critical', rules);
    const summary = escalationSummary(state);
    expect(summary).toContain('ep1');
  });
});
