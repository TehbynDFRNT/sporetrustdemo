export default function ProblemTheatre({ mould, children }) {
  return (
    <div className="problem-theatre mould-strong">
      <div className="problem-theatre-stage" aria-hidden="true" {...mould}></div>
      {children}
    </div>
  );
}
