interface Props {
  message: string | null;
}

/**
  * A basic component to display system notices or messages 
 */
const SystemNotice = ({ message }: Props) => {
  if (!message) return null;

  return <div className="system-notice">{message}</div>;
};

export default SystemNotice;