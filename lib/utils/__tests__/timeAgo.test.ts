import { timeAgo } from '../timeAgo';

describe('timeAgo', () => {
  // Helper to create a Date a specified number of seconds in the past
  const ago = (seconds: number) => new Date(Date.now() - seconds * 1000);

  it('returns "Just now" for < 10 seconds ago', () => {
    expect(timeAgo(ago(3))).toBe('Just now');
    expect(timeAgo(ago(9))).toBe('Just now');
  });

  it('returns seconds format for 10-59 seconds', () => {
    expect(timeAgo(ago(10))).toBe('10s ago');
    expect(timeAgo(ago(45))).toBe('45s ago');
  });

  it('returns minutes format for 1-59 minutes', () => {
    expect(timeAgo(ago(60))).toBe('1m ago');
    expect(timeAgo(ago(60 * 30))).toBe('30m ago');
  });

  it('returns hours format for 1-23 hours', () => {
    expect(timeAgo(ago(3600))).toBe('1h ago');
    expect(timeAgo(ago(3600 * 12))).toBe('12h ago');
  });

  it('returns "Yesterday" for 1 day ago', () => {
    expect(timeAgo(ago(86400))).toBe('Yesterday');
  });

  it('returns days format for 2-6 days', () => {
    expect(timeAgo(ago(86400 * 3))).toBe('3d ago');
    expect(timeAgo(ago(86400 * 6))).toBe('6d ago');
  });

  it('returns weeks format for 1-4 weeks', () => {
    expect(timeAgo(ago(86400 * 7))).toBe('1w ago');
    expect(timeAgo(ago(86400 * 21))).toBe('3w ago');
  });

  it('returns months format for 1-11 months', () => {
    expect(timeAgo(ago(86400 * 60))).toBe('2mo ago');
    expect(timeAgo(ago(86400 * 300))).toBe('10mo ago');
  });

  it('returns years format for 1+ years', () => {
    expect(timeAgo(ago(86400 * 400))).toBe('1y ago');
    expect(timeAgo(ago(86400 * 800))).toBe('2y ago');
  });
});
