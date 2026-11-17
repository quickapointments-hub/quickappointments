import React from 'react';

interface IconProps {
  className?: string;
  size?: number | string;
  color?: string;
  style?: React.CSSProperties;
}

// ============================================================================
// OFFICIAL FONTAWESOME (fontawesome.com) SVG ICONS LIBRARY
// ============================================================================

export const FaHome: React.FC<IconProps> = ({ className = 'w-5 h-5', size = 20, color = 'currentColor', style }) => (
  <svg
    viewBox="0 0 576 512"
    width={size}
    height={size}
    fill={color}
    className={className}
    style={style}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* FontAwesome fa-home / house */}
    <path d="M575.8 255.5c0 18-15 32.1-32 32.1h-32l.7 160.2c0 17-14 32.2-32 32.2h-64c-17 0-32-15-32-32v-96h-64v96c0 17-15 32-32 32h-64c-17 0-32-15-32-32V287.6H32c-18 0-32-14-32-32.1 0-9 3-17 10-24L264.4 15.7c12-11.7 31-11.7 43 0l258.4 215.8c7 7 10 15 10 24z" />
  </svg>
);

export const FaSearch: React.FC<IconProps> = ({ className = 'w-5 h-5', size = 20, color = 'currentColor', style }) => (
  <svg
    viewBox="0 0 512 512"
    width={size}
    height={size}
    fill={color}
    className={className}
    style={style}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* FontAwesome fa-search / magnifying-glass */}
    <path d="M505 442.7L405.3 343c28.4-35.3 45.4-80 45.4-128.7C450.7 96 349.7 0 225.3 0S0 96 0 214.3s101 214.3 225.3 214.3c48.7 0 93.4-17 128.7-45.4L453.7 483c7 7 16.3 10.5 25.6 10.5 9.3 0 18.6-3.5 25.6-10.5 14.2-14.2 14.2-37.3.1-50.3zM225.3 371.3c-86.6 0-157-70.4-157-157s70.4-157 157-157 157 70.4 157 157-70.4 157-157 157z" />
  </svg>
);

export const FaCalendarAlt: React.FC<IconProps> = ({ className = 'w-5 h-5', size = 20, color = 'currentColor', style }) => (
  <svg
    viewBox="0 0 448 512"
    width={size}
    height={size}
    fill={color}
    className={className}
    style={style}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* FontAwesome fa-calendar-alt */}
    <path d="M0 464c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V192H0v272zm320-196c0-6.6 5.4-12 12-12h40c6.6 0 12 5.4 12 12v40c0 6.6-5.4 12-12 12h-40c-6.6 0-12-5.4-12-12v-40zm0 128c0-6.6 5.4-12 12-12h40c6.6 0 12 5.4 12 12v40c0 6.6-5.4 12-12 12h-40c-6.6 0-12-5.4-12-12v-40zM192 268c0-6.6 5.4-12 12-12h40c6.6 0 12 5.4 12 12v40c0 6.6-5.4 12-12 12h-40c-6.6 0-12-5.4-12-12v-40zm0 128c0-6.6 5.4-12 12-12h40c6.6 0 12 5.4 12 12v40c0 6.6-5.4 12-12 12h-40c-6.6 0-12-5.4-12-12v-40zM64 268c0-6.6 5.4-12 12-12h40c6.6 0 12 5.4 12 12v40c0 6.6-5.4 12-12 12H76c-6.6 0-12-5.4-12-12v-40zm0 128c0-6.6 5.4-12 12-12h40c6.6 0 12 5.4 12 12v40c0 6.6-5.4 12-12 12H76c-6.6 0-12-5.4-12-12v-40zM400 64h-48V16c0-8.8-7.2-16-16-16h-32c-8.8 0-16 7.2-16 16v48H160V16c0-8.8-7.2-16-16-16h-32c-8.8 0-16 7.2-16 16v48H48C21.5 64 0 85.5 0 112v48h448v-48c0-26.5-21.5-48-48-48z" />
  </svg>
);

export const FaCalendarCheck: React.FC<IconProps> = ({ className = 'w-5 h-5', size = 20, color = 'currentColor', style }) => (
  <svg
    viewBox="0 0 448 512"
    width={size}
    height={size}
    fill={color}
    className={className}
    style={style}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* FontAwesome fa-calendar-check */}
    <path d="M400 64h-48V16c0-8.8-7.2-16-16-16h-32c-8.8 0-16 7.2-16 16v48H160V16c0-8.8-7.2-16-16-16h-32c-8.8 0-16 7.2-16 16v48H48C21.5 64 0 85.5 0 112v352c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V112c0-26.5-21.5-48-48-48zm-48 400H96c-8.8 0-16-7.2-16-16V192h288v256c0 8.8-7.2 16-16 16zm-79.6-189.5l-84.9 84.9c-4.7 4.7-12.3 4.7-17 0l-42.4-42.4c-4.7-4.7-4.7-12.3 0-17l17-17c4.7-4.7 12.3-4.7 17 0l25.4 25.4 67.9-67.9c4.7-4.7 12.3-4.7 17 0l17 17c4.7 4.7 4.7 12.3 0 17z" />
  </svg>
);

export const FaHeart: React.FC<IconProps> = ({ className = 'w-5 h-5', size = 20, color = 'currentColor', style }) => (
  <svg
    viewBox="0 0 512 512"
    width={size}
    height={size}
    fill={color}
    className={className}
    style={style}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* FontAwesome fa-heart */}
    <path d="M462.3 62.6C407.5 15.9 326 24.3 275.7 76.2L256 96.5l-19.7-20.3C186.1 24.3 104.5 15.9 49.7 62.6c-62.8 53.6-66.1 149.8-9.9 207.9l193.5 199.8c12.5 12.9 32.8 12.9 45.3 0l193.5-199.8c56.3-58.1 53-154.3-9.8-207.9z" />
  </svg>
);

export const FaUser: React.FC<IconProps> = ({ className = 'w-5 h-5', size = 20, color = 'currentColor', style }) => (
  <svg
    viewBox="0 0 448 512"
    width={size}
    height={size}
    fill={color}
    className={className}
    style={style}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* FontAwesome fa-user */}
    <path d="M224 256c70.7 0 128-57.3 128-128S294.7 0 224 0 96 57.3 96 128s57.3 128 128 128zm89.6 32h-16.7c-22.2 10.2-46.9 16-72.9 16s-50.6-5.8-72.9-16h-16.7C67.1 288 0 355.1 0 437.6V464c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48v-26.4c0-82.5-67.1-149.6-134.4-149.6z" />
  </svg>
);

export const FaTachometerAlt: React.FC<IconProps> = ({ className = 'w-5 h-5', size = 20, color = 'currentColor', style }) => (
  <svg
    viewBox="0 0 576 512"
    width={size}
    height={size}
    fill={color}
    className={className}
    style={style}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* FontAwesome fa-tachometer-alt / dashboard */}
    <path d="M288 32C128.9 32 0 160.9 0 320c0 52.8 14.2 102.3 39 144.8 7.3 12.5 22.3 17.5 35.1 11.5l34.4-16.2c13.7-6.5 19.3-22.7 12.8-36.4C102.4 384.8 96 353.1 96 320c0-106 86-192 192-192s192 86 192 192c0 33.1-6.4 64.8-25.3 103.7-6.5 13.7-.9 29.9 12.8 36.4l34.4 16.2c12.8 6 27.8 1 35.1-11.5C561.8 422.3 576 372.8 576 320 576 160.9 447.1 32 288 32zm85.5 170.5l-74.9 74.9c-3.4-1.2-7-1.8-10.6-1.8-17.7 0-32 14.3-32 32s14.3 32 32 32 32-14.3 32-32c0-3.6-.6-7.2-1.8-10.6l74.9-74.9c6.2-6.2 6.2-16.4 0-22.6s-16.3-6.2-22.6 0z" />
  </svg>
);

export const FaClock: React.FC<IconProps> = ({ className = 'w-5 h-5', size = 20, color = 'currentColor', style }) => (
  <svg
    viewBox="0 0 512 512"
    width={size}
    height={size}
    fill={color}
    className={className}
    style={style}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* FontAwesome fa-clock */}
    <path d="M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zm0 448c-110.5 0-200-89.5-200-200S145.5 56 256 56s200 89.5 200 200-89.5 200-200 200zm61.8-104.4l-84.9-61.7c-3.1-2.3-4.9-5.9-4.9-9.7V144c0-6.6 5.4-12 12-12h24c6.6 0 12 5.4 12 12v114.7l70.9 51.5c5.4 3.9 6.5 11.4 2.6 16.8l-15.8 21.8c-3.9 5.4-11.4 6.5-16.9 2.6z" />
  </svg>
);

export const FaWallet: React.FC<IconProps> = ({ className = 'w-5 h-5', size = 20, color = 'currentColor', style }) => (
  <svg
    viewBox="0 0 512 512"
    width={size}
    height={size}
    fill={color}
    className={className}
    style={style}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* FontAwesome fa-wallet */}
    <path d="M461.2 128H80c-8.84 0-16-7.16-16-16s7.16-16 16-16h384c8.84 0 16-7.16 16-16 0-26.51-21.49-48-48-48H64C28.65 32 0 60.65 0 96v320c0 35.35 28.65 64 64 64h397.2c28.02 0 50.8-21.53 50.8-48V176c0-26.47-22.78-48-50.8-48zM416 336c-17.67 0-32-14.33-32-32s14.33-32 32-32 32 14.33 32 32-14.33 32-32 32z" />
  </svg>
);

export const FaCoins: React.FC<IconProps> = ({ className = 'w-5 h-5', size = 20, color = 'currentColor', style }) => (
  <svg
    viewBox="0 0 512 512"
    width={size}
    height={size}
    fill={color}
    className={className}
    style={style}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* FontAwesome fa-coins */}
    <path d="M0 405.3C0 449.8 114.6 480 256 480s256-30.2 256-74.7V336H0v69.3zM256 32C114.6 32 0 62.2 0 106.7v69.3c0 44.5 114.6 74.7 256 74.7s256-30.2 256-74.7V106.7C512 62.2 397.4 32 256 32zm0 170.7c-93.6 0-170.7-18.7-170.7-42.7s77.1-42.7 170.7-42.7 170.7 18.7 170.7 42.7-77.1 42.7-170.7 42.7zm256 74.6V208c-42.1 27.6-118.8 45.3-208 47.7v50.2c89.2-2.4 165.9-20.1 208-47.9zm-304 0c42.1 27.8 118.8 45.5 208 47.9v-50.2c-89.2-2.4-165.9-20.1-208-47.7V277.3z" />
  </svg>
);

export const FaMapMarkerAlt: React.FC<IconProps> = ({ className = 'w-5 h-5', size = 20, color = 'currentColor', style }) => (
  <svg
    viewBox="0 0 384 512"
    width={size}
    height={size}
    fill={color}
    className={className}
    style={style}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* FontAwesome fa-map-marker-alt */}
    <path d="M172.268 501.67C26.97 291.031 0 269.413 0 192 0 85.961 85.961 0 192 0s192 85.961 192 192c0 77.413-26.97 99.031-172.268 309.67-9.535 13.774-29.93 13.773-39.464 0zM192 272c44.183 0 80-35.817 80-80s-35.817-80-80-80-80 35.817-80 80 35.817 80 80 80z" />
  </svg>
);

export const FaFilter: React.FC<IconProps> = ({ className = 'w-5 h-5', size = 20, color = 'currentColor', style }) => (
  <svg
    viewBox="0 0 512 512"
    width={size}
    height={size}
    fill={color}
    className={className}
    style={style}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* FontAwesome fa-filter */}
    <path d="M487.976 0H24.028C2.71 0-8.047 25.866 7.058 40.971L192 225.941V432c0 7.831 3.821 15.17 10.237 19.674l80 56.002C298.026 518.528 320 507.037 320 488V225.941l184.943-184.97C520.047 25.866 509.29 0 487.976 0z" />
  </svg>
);

export const FaFileInvoice: React.FC<IconProps> = ({ className = 'w-5 h-5', size = 20, color = 'currentColor', style }) => (
  <svg
    viewBox="0 0 384 512"
    width={size}
    height={size}
    fill={color}
    className={className}
    style={style}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* FontAwesome fa-file-invoice */}
    <path d="M377 105L279.1 7c-4.5-4.5-10.6-7-17-7H24C10.7 0 0 10.7 0 24v464c0 13.3 10.7 24 24 24h336c13.3 0 24-10.7 24-24V122c0-6.4-2.5-12.5-7-17zM256 38.6L345.4 128H256V38.6zM64 448V64h128v96c0 17.7 14.3 32 32 32h96v256H64zm64-224h128c8.8 0 16-7.2 16-16s-7.2-16-16-16H128c-8.8 0-16 7.2-16 16s7.2 16 16 16zm128 64H128c-8.8 0-16 7.2-16 16s7.2 16 16 16h128c8.8 0 16-7.2 16-16s-7.2-16-16-16zm0 64H128c-8.8 0-16 7.2-16 16s7.2 16 16 16h128c8.8 0 16-7.2 16-16s-7.2-16-16-16z" />
  </svg>
);

export const FaTicketAlt: React.FC<IconProps> = ({ className = 'w-5 h-5', size = 20, color = 'currentColor', style }) => (
  <svg
    viewBox="0 0 512 512"
    width={size}
    height={size}
    fill={color}
    className={className}
    style={style}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* FontAwesome fa-ticket-alt */}
    <path d="M0 160c0-17.7 14.3-32 32-32h448c17.7 0 32 14.3 32 32v48c-26.5 0-48 21.5-48 48s21.5 48 48 48v48c0 17.7-14.3 32-32 32H32c-17.7 0-32-14.3-32-32v-48c26.5 0 48-21.5 48-48s-21.5-48-48-48v-48zm352 160c8.8 0 16-7.2 16-16V192c0-8.8-7.2-16-16-16s-16 7.2-16 16v112c0 8.8 7.2 16 16 16zm-96 0c8.8 0 16-7.2 16-16V192c0-8.8-7.2-16-16-16s-16 7.2-16 16v112c0 8.8 7.2 16 16 16zm-96 0c8.8 0 16-7.2 16-16V192c0-8.8-7.2-16-16-16s-16 7.2-16 16v112c0 8.8 7.2 16 16 16z" />
  </svg>
);

export const FaImages: React.FC<IconProps> = ({ className = 'w-5 h-5', size = 20, color = 'currentColor', style }) => (
  <svg
    viewBox="0 0 576 512"
    width={size}
    height={size}
    fill={color}
    className={className}
    style={style}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* FontAwesome fa-images */}
    <path d="M480 416V160c0-35.3-28.7-64-64-64H96C60.7 96 32 124.7 32 160v256c0 35.3 28.7 64 64 64h320c35.3 0 64-28.7 64-64zm64-320v256c0 17.7-14.3 32-32 32h-16v-288c0-44.2-35.8-80-80-80H128V48c0-17.7 14.3-32 32-32h320c35.3 0 64 28.7 64 64zm-144 96a32 32 0 1 1-64 0 32 32 0 0 1 64 0zM128 384l64-80 48 60 80-100 80 120H128z" />
  </svg>
);

export const FaCheckCircle: React.FC<IconProps> = ({ className = 'w-5 h-5', size = 20, color = 'currentColor', style }) => (
  <svg
    viewBox="0 0 512 512"
    width={size}
    height={size}
    fill={color}
    className={className}
    style={style}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* FontAwesome fa-check-circle */}
    <path d="M504 256c0 136.967-111.033 248-248 248S8 392.967 8 256 119.033 8 256 8s248 111.033 248 248zM227.314 387.314l184-184c6.248-6.248 6.248-16.379 0-22.627l-22.627-22.627c-6.248-6.249-16.379-6.249-22.628 0L216 308.118l-70.059-70.059c-6.248-6.248-16.379-6.248-22.628 0l-22.627 22.627c-6.248 6.248-6.248 16.379 0 22.627l104 104c6.249 6.249 16.379 6.249 22.628 0z" />
  </svg>
);

export const FaTimes: React.FC<IconProps> = ({ className = 'w-5 h-5', size = 20, color = 'currentColor', style }) => (
  <svg
    viewBox="0 0 352 512"
    width={size}
    height={size}
    fill={color}
    className={className}
    style={style}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* FontAwesome fa-times */}
    <path d="M242.72 256l100.07-100.07c12.28-12.28 12.28-32.19 0-44.48l-22.24-22.24c-12.28-12.28-32.19-12.28-44.48 0L176 189.28 75.93 89.21c-12.28-12.28-32.19-12.28-44.48 0L9.21 111.45c-12.28 12.28-12.28 32.19 0 44.48L109.28 256 9.21 356.07c-12.28 12.28-12.28 32.19 0 44.48l22.24 22.24c12.28 12.28 32.2 12.28 44.48 0L176 322.72l100.07 100.07c12.28 12.28 32.2 12.28 44.48 0l22.24-22.24c12.28-12.28 12.28-32.19 0-44.48L242.72 256z" />
  </svg>
);

export const FaPlus: React.FC<IconProps> = ({ className = 'w-5 h-5', size = 20, color = 'currentColor', style }) => (
  <svg
    viewBox="0 0 448 512"
    width={size}
    height={size}
    fill={color}
    className={className}
    style={style}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* FontAwesome fa-plus */}
    <path d="M416 208H272V64c0-17.67-14.33-32-32-32h-32c-17.67 0-32 14.33-32 32v144H32c-17.67 0-32 14.33-32 32v32c0 17.67 14.33 32 32 32h144v144c0 17.67 14.33 32 32 32h32c17.67 0 32-14.33 32-32V304h144c17.67 0 32-14.33 32-32v-32c0-17.67-14.33-32-32-32z" />
  </svg>
);

export const FaLayerGroup: React.FC<IconProps> = ({ className = 'w-5 h-5', size = 20, color = 'currentColor', style }) => (
  <svg
    viewBox="0 0 512 512"
    width={size}
    height={size}
    fill={color}
    className={className}
    style={style}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* FontAwesome fa-layer-group */}
    <path d="M12.41 187.59l232.06 120.44c7.34 3.81 16.73 3.81 24.07 0l231.06-119.9c14.61-7.58 14.8-28.53.31-36.36L268.48 2.82c-7.85-4.22-17.3-4.22-25.14 0L12.09 151.23c-14.48 7.83-14.29 28.78.32 36.36zM256 349.54l-117.47-60.98-100.8 52.32c-14.49 7.52-14.69 28.45-.25 36.26l217.45 117.3c7.89 4.25 17.46 4.25 25.35 0l217.45-117.3c14.44-7.81 14.24-28.74-.25-36.26l-100.8-52.32L256 349.54z" />
  </svg>
);
