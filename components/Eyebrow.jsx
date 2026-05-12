export default function Eyebrow({ children, as: Tag = "span", className = "", ...rest }) {
  return (
    <Tag className={`eyebrow${className ? ` ${className}` : ""}`} {...rest}>
      [ {children} ]
    </Tag>
  );
}
