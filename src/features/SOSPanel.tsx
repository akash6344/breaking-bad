import { BreathingLoader } from '../components/BreathingLoader';
import { SOSCard } from '../components/CoachCards';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { RangeField } from '../components/RangeField';
import type { CoachSource, SOSResponse } from '../types';

interface SOSPanelProps {
  intensity: number;
  onIntensityChange: (value: number) => void;
  loading: boolean;
  error: string;
  onRequest: () => void;
  result: { data: SOSResponse; source: CoachSource } | null;
}

export function SOSPanel({
  intensity,
  onIntensityChange,
  loading,
  error,
  onRequest,
  result,
}: SOSPanelProps) {
  return (
    <section className="sos-panel" aria-labelledby="sos-title">
      <div>
        <p className="eyebrow">SOS mode</p>
        <h2 id="sos-title">A craving is a wave. Let’s get through this one.</h2>
        <RangeField
          id="craving-intensity"
          label="How intense is it?"
          value={intensity}
          min={1}
          max={10}
          minLabel="Manageable"
          maxLabel="Overwhelming"
          onChange={onIntensityChange}
        />
        <button className="sos-button" onClick={onRequest} disabled={loading} aria-busy={loading}>
          {loading ? 'Stay with your breath…' : 'I need support now'}
        </button>
        {error && <p className="form-error" role="alert">{error}</p>}
      </div>
      {loading ? (
        <BreathingLoader />
      ) : result ? (
        <ErrorBoundary title="The SOS response could not be shown. Please try again.">
          <SOSCard response={result.data} source={result.source} />
        </ErrorBoundary>
      ) : null}
    </section>
  );
}
