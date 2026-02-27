interface Props {
  message: string | null;
}

const SystemNotice = ({ message }: Props) => {
  if (!message) return null;

  return <div className="system-notice">{message}</div>;
};

export default SystemNotice;