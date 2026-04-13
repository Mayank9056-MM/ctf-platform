export function FieldErr({ errors, name }: { name: string }) {
  const err = errors[name];
  return err ? (
    <p className="text-xs text-red-400 mt-1">{err.message}</p>
  ) : null;
}
