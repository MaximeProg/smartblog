export const CONTINENTS = [
  { code: 'AF', en: 'Africa',        fr: 'Afrique'          },
  { code: 'AN', en: 'Antarctica',    fr: 'Antarctique'      },
  { code: 'AS', en: 'Asia',          fr: 'Asie'             },
  { code: 'EU', en: 'Europe',        fr: 'Europe'           },
  { code: 'NA', en: 'North America', fr: 'Amérique du Nord' },
  { code: 'OC', en: 'Oceania',       fr: 'Océanie'          },
  { code: 'SA', en: 'South America', fr: 'Amérique du Sud'  },
] as const;

export type ContinentCode = typeof CONTINENTS[number]['code'];

export interface Country {
  code: string;       // ISO 3166-1 alpha-2
  name: string;
  continent: string;
  dialCode: string;   // e.g. "+33"
  // Nombre de chiffres attendu pour le numéro national (sans l'indicatif),
  // en [min, max] — souvent une valeur fixe (min===max), parfois une plage
  // quand le pays a des longueurs variables selon l'opérateur/le type de
  // ligne. Best-effort (données ITU/plans de numérotation nationaux) — à
  // corriger au cas par cas si un pays précis s'avère faux à l'usage.
  phoneDigits: [number, number];
}

export const COUNTRIES = [
  // ── Africa ────────────────────────────────────────────────────────
  { code: 'DZ', name: 'Algeria',                  continent: 'AF', dialCode: '+213', phoneDigits: [9, 9] },
  { code: 'AO', name: 'Angola',                   continent: 'AF', dialCode: '+244', phoneDigits: [9, 9] },
  { code: 'BJ', name: 'Benin',                    continent: 'AF', dialCode: '+229', phoneDigits: [10, 10] },
  { code: 'BW', name: 'Botswana',                 continent: 'AF', dialCode: '+267', phoneDigits: [8, 8] },
  { code: 'BF', name: 'Burkina Faso',             continent: 'AF', dialCode: '+226', phoneDigits: [8, 8] },
  { code: 'BI', name: 'Burundi',                  continent: 'AF', dialCode: '+257', phoneDigits: [8, 8] },
  { code: 'CV', name: 'Cabo Verde',               continent: 'AF', dialCode: '+238', phoneDigits: [7, 7] },
  { code: 'CM', name: 'Cameroon',                 continent: 'AF', dialCode: '+237', phoneDigits: [9, 9] },
  { code: 'CF', name: 'Central African Republic', continent: 'AF', dialCode: '+236', phoneDigits: [8, 8] },
  { code: 'TD', name: 'Chad',                     continent: 'AF', dialCode: '+235', phoneDigits: [8, 8] },
  { code: 'KM', name: 'Comoros',                  continent: 'AF', dialCode: '+269', phoneDigits: [7, 7] },
  { code: 'CG', name: 'Congo',                    continent: 'AF', dialCode: '+242', phoneDigits: [9, 9] },
  { code: 'CD', name: 'Congo (DRC)',               continent: 'AF', dialCode: '+243', phoneDigits: [9, 9] },
  { code: 'CI', name: "Côte d'Ivoire",            continent: 'AF', dialCode: '+225', phoneDigits: [10, 10] },
  { code: 'DJ', name: 'Djibouti',                 continent: 'AF', dialCode: '+253', phoneDigits: [8, 8] },
  { code: 'EG', name: 'Egypt',                    continent: 'AF', dialCode: '+20',  phoneDigits: [9, 10] },
  { code: 'GQ', name: 'Equatorial Guinea',        continent: 'AF', dialCode: '+240', phoneDigits: [9, 9] },
  { code: 'ER', name: 'Eritrea',                  continent: 'AF', dialCode: '+291', phoneDigits: [7, 7] },
  { code: 'SZ', name: 'Eswatini',                 continent: 'AF', dialCode: '+268', phoneDigits: [8, 8] },
  { code: 'ET', name: 'Ethiopia',                 continent: 'AF', dialCode: '+251', phoneDigits: [9, 9] },
  { code: 'GA', name: 'Gabon',                    continent: 'AF', dialCode: '+241', phoneDigits: [8, 9] },
  { code: 'GM', name: 'Gambia',                   continent: 'AF', dialCode: '+220', phoneDigits: [7, 7] },
  { code: 'GH', name: 'Ghana',                    continent: 'AF', dialCode: '+233', phoneDigits: [9, 9] },
  { code: 'GN', name: 'Guinea',                   continent: 'AF', dialCode: '+224', phoneDigits: [8, 9] },
  { code: 'GW', name: 'Guinea-Bissau',            continent: 'AF', dialCode: '+245', phoneDigits: [7, 7] },
  { code: 'KE', name: 'Kenya',                    continent: 'AF', dialCode: '+254', phoneDigits: [9, 9] },
  { code: 'LS', name: 'Lesotho',                  continent: 'AF', dialCode: '+266', phoneDigits: [8, 8] },
  { code: 'LR', name: 'Liberia',                  continent: 'AF', dialCode: '+231', phoneDigits: [7, 9] },
  { code: 'LY', name: 'Libya',                    continent: 'AF', dialCode: '+218', phoneDigits: [9, 9] },
  { code: 'MG', name: 'Madagascar',               continent: 'AF', dialCode: '+261', phoneDigits: [9, 9] },
  { code: 'MW', name: 'Malawi',                   continent: 'AF', dialCode: '+265', phoneDigits: [9, 9] },
  { code: 'ML', name: 'Mali',                     continent: 'AF', dialCode: '+223', phoneDigits: [8, 8] },
  { code: 'MR', name: 'Mauritania',               continent: 'AF', dialCode: '+222', phoneDigits: [8, 8] },
  { code: 'MU', name: 'Mauritius',                continent: 'AF', dialCode: '+230', phoneDigits: [7, 8] },
  { code: 'MA', name: 'Morocco',                  continent: 'AF', dialCode: '+212', phoneDigits: [9, 9] },
  { code: 'MZ', name: 'Mozambique',               continent: 'AF', dialCode: '+258', phoneDigits: [9, 9] },
  { code: 'NA', name: 'Namibia',                  continent: 'AF', dialCode: '+264', phoneDigits: [9, 9] },
  { code: 'NE', name: 'Niger',                    continent: 'AF', dialCode: '+227', phoneDigits: [8, 8] },
  { code: 'NG', name: 'Nigeria',                  continent: 'AF', dialCode: '+234', phoneDigits: [10, 10] },
  { code: 'RW', name: 'Rwanda',                   continent: 'AF', dialCode: '+250', phoneDigits: [9, 9] },
  { code: 'ST', name: 'São Tomé and Príncipe',    continent: 'AF', dialCode: '+239', phoneDigits: [7, 7] },
  { code: 'SN', name: 'Senegal',                  continent: 'AF', dialCode: '+221', phoneDigits: [9, 9] },
  { code: 'SC', name: 'Seychelles',               continent: 'AF', dialCode: '+248', phoneDigits: [7, 7] },
  { code: 'SL', name: 'Sierra Leone',             continent: 'AF', dialCode: '+232', phoneDigits: [8, 8] },
  { code: 'SO', name: 'Somalia',                  continent: 'AF', dialCode: '+252', phoneDigits: [7, 8] },
  { code: 'ZA', name: 'South Africa',             continent: 'AF', dialCode: '+27',  phoneDigits: [9, 9] },
  { code: 'SS', name: 'South Sudan',              continent: 'AF', dialCode: '+211', phoneDigits: [9, 9] },
  { code: 'SD', name: 'Sudan',                    continent: 'AF', dialCode: '+249', phoneDigits: [9, 9] },
  { code: 'TZ', name: 'Tanzania',                 continent: 'AF', dialCode: '+255', phoneDigits: [9, 9] },
  { code: 'TG', name: 'Togo',                     continent: 'AF', dialCode: '+228', phoneDigits: [8, 8] },
  { code: 'TN', name: 'Tunisia',                  continent: 'AF', dialCode: '+216', phoneDigits: [8, 8] },
  { code: 'UG', name: 'Uganda',                   continent: 'AF', dialCode: '+256', phoneDigits: [9, 9] },
  { code: 'ZM', name: 'Zambia',                   continent: 'AF', dialCode: '+260', phoneDigits: [9, 9] },
  { code: 'ZW', name: 'Zimbabwe',                 continent: 'AF', dialCode: '+263', phoneDigits: [9, 9] },

  // ── Antarctica ────────────────────────────────────────────────────
  { code: 'AQ', name: 'Antarctica',               continent: 'AN', dialCode: '+672', phoneDigits: [6, 10] },

  // ── Asia ──────────────────────────────────────────────────────────
  { code: 'AF', name: 'Afghanistan',              continent: 'AS', dialCode: '+93',  phoneDigits: [9, 9] },
  { code: 'AM', name: 'Armenia',                  continent: 'AS', dialCode: '+374', phoneDigits: [8, 8] },
  { code: 'AZ', name: 'Azerbaijan',               continent: 'AS', dialCode: '+994', phoneDigits: [9, 9] },
  { code: 'BH', name: 'Bahrain',                  continent: 'AS', dialCode: '+973', phoneDigits: [8, 8] },
  { code: 'BD', name: 'Bangladesh',               continent: 'AS', dialCode: '+880', phoneDigits: [10, 10] },
  { code: 'BT', name: 'Bhutan',                   continent: 'AS', dialCode: '+975', phoneDigits: [8, 8] },
  { code: 'BN', name: 'Brunei',                   continent: 'AS', dialCode: '+673', phoneDigits: [7, 7] },
  { code: 'KH', name: 'Cambodia',                 continent: 'AS', dialCode: '+855', phoneDigits: [8, 9] },
  { code: 'CN', name: 'China',                    continent: 'AS', dialCode: '+86',  phoneDigits: [11, 11] },
  { code: 'CY', name: 'Cyprus',                   continent: 'AS', dialCode: '+357', phoneDigits: [8, 8] },
  { code: 'GE', name: 'Georgia',                  continent: 'AS', dialCode: '+995', phoneDigits: [9, 9] },
  { code: 'IN', name: 'India',                    continent: 'AS', dialCode: '+91',  phoneDigits: [10, 10] },
  { code: 'ID', name: 'Indonesia',                continent: 'AS', dialCode: '+62',  phoneDigits: [9, 12] },
  { code: 'IR', name: 'Iran',                     continent: 'AS', dialCode: '+98',  phoneDigits: [10, 10] },
  { code: 'IQ', name: 'Iraq',                     continent: 'AS', dialCode: '+964', phoneDigits: [10, 10] },
  { code: 'IL', name: 'Israel',                   continent: 'AS', dialCode: '+972', phoneDigits: [9, 9] },
  { code: 'JP', name: 'Japan',                    continent: 'AS', dialCode: '+81',  phoneDigits: [10, 10] },
  { code: 'JO', name: 'Jordan',                   continent: 'AS', dialCode: '+962', phoneDigits: [9, 9] },
  { code: 'KZ', name: 'Kazakhstan',               continent: 'AS', dialCode: '+7',   phoneDigits: [10, 10] },
  { code: 'KW', name: 'Kuwait',                   continent: 'AS', dialCode: '+965', phoneDigits: [8, 8] },
  { code: 'KG', name: 'Kyrgyzstan',               continent: 'AS', dialCode: '+996', phoneDigits: [9, 9] },
  { code: 'LA', name: 'Laos',                     continent: 'AS', dialCode: '+856', phoneDigits: [8, 9] },
  { code: 'LB', name: 'Lebanon',                  continent: 'AS', dialCode: '+961', phoneDigits: [7, 8] },
  { code: 'MY', name: 'Malaysia',                 continent: 'AS', dialCode: '+60',  phoneDigits: [9, 10] },
  { code: 'MV', name: 'Maldives',                 continent: 'AS', dialCode: '+960', phoneDigits: [7, 7] },
  { code: 'MN', name: 'Mongolia',                 continent: 'AS', dialCode: '+976', phoneDigits: [8, 8] },
  { code: 'MM', name: 'Myanmar',                  continent: 'AS', dialCode: '+95',  phoneDigits: [8, 9] },
  { code: 'NP', name: 'Nepal',                    continent: 'AS', dialCode: '+977', phoneDigits: [10, 10] },
  { code: 'KP', name: 'North Korea',              continent: 'AS', dialCode: '+850', phoneDigits: [6, 10] },
  { code: 'OM', name: 'Oman',                     continent: 'AS', dialCode: '+968', phoneDigits: [8, 8] },
  { code: 'PK', name: 'Pakistan',                 continent: 'AS', dialCode: '+92',  phoneDigits: [10, 10] },
  { code: 'PS', name: 'Palestine',                continent: 'AS', dialCode: '+970', phoneDigits: [9, 9] },
  { code: 'PH', name: 'Philippines',              continent: 'AS', dialCode: '+63',  phoneDigits: [10, 10] },
  { code: 'QA', name: 'Qatar',                    continent: 'AS', dialCode: '+974', phoneDigits: [8, 8] },
  { code: 'SA', name: 'Saudi Arabia',             continent: 'AS', dialCode: '+966', phoneDigits: [9, 9] },
  { code: 'SG', name: 'Singapore',                continent: 'AS', dialCode: '+65',  phoneDigits: [8, 8] },
  { code: 'KR', name: 'South Korea',              continent: 'AS', dialCode: '+82',  phoneDigits: [9, 10] },
  { code: 'LK', name: 'Sri Lanka',                continent: 'AS', dialCode: '+94',  phoneDigits: [9, 9] },
  { code: 'SY', name: 'Syria',                    continent: 'AS', dialCode: '+963', phoneDigits: [9, 9] },
  { code: 'TW', name: 'Taiwan',                   continent: 'AS', dialCode: '+886', phoneDigits: [9, 9] },
  { code: 'TJ', name: 'Tajikistan',               continent: 'AS', dialCode: '+992', phoneDigits: [9, 9] },
  { code: 'TH', name: 'Thailand',                 continent: 'AS', dialCode: '+66',  phoneDigits: [9, 9] },
  { code: 'TL', name: 'Timor-Leste',              continent: 'AS', dialCode: '+670', phoneDigits: [7, 8] },
  { code: 'TR', name: 'Turkey',                   continent: 'AS', dialCode: '+90',  phoneDigits: [10, 10] },
  { code: 'TM', name: 'Turkmenistan',             continent: 'AS', dialCode: '+993', phoneDigits: [8, 8] },
  { code: 'AE', name: 'United Arab Emirates',     continent: 'AS', dialCode: '+971', phoneDigits: [9, 9] },
  { code: 'UZ', name: 'Uzbekistan',               continent: 'AS', dialCode: '+998', phoneDigits: [9, 9] },
  { code: 'VN', name: 'Vietnam',                  continent: 'AS', dialCode: '+84',  phoneDigits: [9, 10] },
  { code: 'YE', name: 'Yemen',                    continent: 'AS', dialCode: '+967', phoneDigits: [9, 9] },

  // ── Europe ────────────────────────────────────────────────────────
  { code: 'AL', name: 'Albania',                  continent: 'EU', dialCode: '+355', phoneDigits: [9, 9] },
  { code: 'AD', name: 'Andorra',                  continent: 'EU', dialCode: '+376', phoneDigits: [6, 6] },
  { code: 'AT', name: 'Austria',                  continent: 'EU', dialCode: '+43',  phoneDigits: [9, 12] },
  { code: 'BY', name: 'Belarus',                  continent: 'EU', dialCode: '+375', phoneDigits: [9, 9] },
  { code: 'BE', name: 'Belgium',                  continent: 'EU', dialCode: '+32',  phoneDigits: [9, 9] },
  { code: 'BA', name: 'Bosnia and Herzegovina',   continent: 'EU', dialCode: '+387', phoneDigits: [8, 8] },
  { code: 'BG', name: 'Bulgaria',                 continent: 'EU', dialCode: '+359', phoneDigits: [8, 9] },
  { code: 'HR', name: 'Croatia',                  continent: 'EU', dialCode: '+385', phoneDigits: [8, 9] },
  { code: 'CZ', name: 'Czech Republic',           continent: 'EU', dialCode: '+420', phoneDigits: [9, 9] },
  { code: 'DK', name: 'Denmark',                  continent: 'EU', dialCode: '+45',  phoneDigits: [8, 8] },
  { code: 'EE', name: 'Estonia',                  continent: 'EU', dialCode: '+372', phoneDigits: [7, 8] },
  { code: 'FI', name: 'Finland',                  continent: 'EU', dialCode: '+358', phoneDigits: [9, 10] },
  { code: 'FR', name: 'France',                   continent: 'EU', dialCode: '+33',  phoneDigits: [9, 9] },
  { code: 'DE', name: 'Germany',                  continent: 'EU', dialCode: '+49',  phoneDigits: [10, 11] },
  { code: 'GR', name: 'Greece',                   continent: 'EU', dialCode: '+30',  phoneDigits: [10, 10] },
  { code: 'HU', name: 'Hungary',                  continent: 'EU', dialCode: '+36',  phoneDigits: [9, 9] },
  { code: 'IS', name: 'Iceland',                  continent: 'EU', dialCode: '+354', phoneDigits: [7, 7] },
  { code: 'IE', name: 'Ireland',                  continent: 'EU', dialCode: '+353', phoneDigits: [9, 9] },
  { code: 'IT', name: 'Italy',                    continent: 'EU', dialCode: '+39',  phoneDigits: [9, 10] },
  { code: 'XK', name: 'Kosovo',                   continent: 'EU', dialCode: '+383', phoneDigits: [8, 8] },
  { code: 'LV', name: 'Latvia',                   continent: 'EU', dialCode: '+371', phoneDigits: [8, 8] },
  { code: 'LI', name: 'Liechtenstein',            continent: 'EU', dialCode: '+423', phoneDigits: [7, 7] },
  { code: 'LT', name: 'Lithuania',                continent: 'EU', dialCode: '+370', phoneDigits: [8, 8] },
  { code: 'LU', name: 'Luxembourg',               continent: 'EU', dialCode: '+352', phoneDigits: [8, 9] },
  { code: 'MT', name: 'Malta',                    continent: 'EU', dialCode: '+356', phoneDigits: [8, 8] },
  { code: 'MD', name: 'Moldova',                  continent: 'EU', dialCode: '+373', phoneDigits: [8, 8] },
  { code: 'MC', name: 'Monaco',                   continent: 'EU', dialCode: '+377', phoneDigits: [8, 9] },
  { code: 'ME', name: 'Montenegro',               continent: 'EU', dialCode: '+382', phoneDigits: [8, 8] },
  { code: 'NL', name: 'Netherlands',              continent: 'EU', dialCode: '+31',  phoneDigits: [9, 9] },
  { code: 'MK', name: 'North Macedonia',          continent: 'EU', dialCode: '+389', phoneDigits: [8, 8] },
  { code: 'NO', name: 'Norway',                   continent: 'EU', dialCode: '+47',  phoneDigits: [8, 8] },
  { code: 'PL', name: 'Poland',                   continent: 'EU', dialCode: '+48',  phoneDigits: [9, 9] },
  { code: 'PT', name: 'Portugal',                 continent: 'EU', dialCode: '+351', phoneDigits: [9, 9] },
  { code: 'RO', name: 'Romania',                  continent: 'EU', dialCode: '+40',  phoneDigits: [9, 9] },
  { code: 'RU', name: 'Russia',                   continent: 'EU', dialCode: '+7',   phoneDigits: [10, 10] },
  { code: 'SM', name: 'San Marino',               continent: 'EU', dialCode: '+378', phoneDigits: [6, 10] },
  { code: 'RS', name: 'Serbia',                   continent: 'EU', dialCode: '+381', phoneDigits: [8, 9] },
  { code: 'SK', name: 'Slovakia',                 continent: 'EU', dialCode: '+421', phoneDigits: [9, 9] },
  { code: 'SI', name: 'Slovenia',                 continent: 'EU', dialCode: '+386', phoneDigits: [8, 8] },
  { code: 'ES', name: 'Spain',                    continent: 'EU', dialCode: '+34',  phoneDigits: [9, 9] },
  { code: 'SE', name: 'Sweden',                   continent: 'EU', dialCode: '+46',  phoneDigits: [7, 9] },
  { code: 'CH', name: 'Switzerland',               continent: 'EU', dialCode: '+41',  phoneDigits: [9, 9] },
  { code: 'UA', name: 'Ukraine',                  continent: 'EU', dialCode: '+380', phoneDigits: [9, 9] },
  { code: 'GB', name: 'United Kingdom',           continent: 'EU', dialCode: '+44',  phoneDigits: [10, 10] },
  { code: 'VA', name: 'Vatican City',             continent: 'EU', dialCode: '+379', phoneDigits: [9, 10] },

  // ── North America ─────────────────────────────────────────────────
  { code: 'AG', name: 'Antigua and Barbuda',      continent: 'NA', dialCode: '+1',   phoneDigits: [10, 10] },
  { code: 'BS', name: 'Bahamas',                  continent: 'NA', dialCode: '+1',   phoneDigits: [10, 10] },
  { code: 'BB', name: 'Barbados',                 continent: 'NA', dialCode: '+1',   phoneDigits: [10, 10] },
  { code: 'BZ', name: 'Belize',                   continent: 'NA', dialCode: '+501', phoneDigits: [7, 7] },
  { code: 'CA', name: 'Canada',                   continent: 'NA', dialCode: '+1',   phoneDigits: [10, 10] },
  { code: 'CR', name: 'Costa Rica',               continent: 'NA', dialCode: '+506', phoneDigits: [8, 8] },
  { code: 'CU', name: 'Cuba',                     continent: 'NA', dialCode: '+53',  phoneDigits: [8, 8] },
  { code: 'DM', name: 'Dominica',                 continent: 'NA', dialCode: '+1',   phoneDigits: [10, 10] },
  { code: 'DO', name: 'Dominican Republic',       continent: 'NA', dialCode: '+1',   phoneDigits: [10, 10] },
  { code: 'SV', name: 'El Salvador',              continent: 'NA', dialCode: '+503', phoneDigits: [8, 8] },
  { code: 'GD', name: 'Grenada',                  continent: 'NA', dialCode: '+1',   phoneDigits: [10, 10] },
  { code: 'GT', name: 'Guatemala',                continent: 'NA', dialCode: '+502', phoneDigits: [8, 8] },
  { code: 'HT', name: 'Haiti',                    continent: 'NA', dialCode: '+509', phoneDigits: [8, 8] },
  { code: 'HN', name: 'Honduras',                 continent: 'NA', dialCode: '+504', phoneDigits: [8, 8] },
  { code: 'JM', name: 'Jamaica',                  continent: 'NA', dialCode: '+1',   phoneDigits: [10, 10] },
  { code: 'MX', name: 'Mexico',                   continent: 'NA', dialCode: '+52',  phoneDigits: [10, 10] },
  { code: 'NI', name: 'Nicaragua',                continent: 'NA', dialCode: '+505', phoneDigits: [8, 8] },
  { code: 'PA', name: 'Panama',                   continent: 'NA', dialCode: '+507', phoneDigits: [7, 8] },
  { code: 'KN', name: 'Saint Kitts and Nevis',    continent: 'NA', dialCode: '+1',   phoneDigits: [10, 10] },
  { code: 'LC', name: 'Saint Lucia',              continent: 'NA', dialCode: '+1',   phoneDigits: [10, 10] },
  { code: 'VC', name: 'Saint Vincent',            continent: 'NA', dialCode: '+1',   phoneDigits: [10, 10] },
  { code: 'TT', name: 'Trinidad and Tobago',      continent: 'NA', dialCode: '+1',   phoneDigits: [10, 10] },
  { code: 'US', name: 'United States',            continent: 'NA', dialCode: '+1',   phoneDigits: [10, 10] },

  // ── Oceania ───────────────────────────────────────────────────────
  { code: 'AU', name: 'Australia',                continent: 'OC', dialCode: '+61',  phoneDigits: [9, 9] },
  { code: 'FJ', name: 'Fiji',                     continent: 'OC', dialCode: '+679', phoneDigits: [7, 7] },
  { code: 'KI', name: 'Kiribati',                 continent: 'OC', dialCode: '+686', phoneDigits: [5, 8] },
  { code: 'MH', name: 'Marshall Islands',         continent: 'OC', dialCode: '+692', phoneDigits: [7, 7] },
  { code: 'FM', name: 'Micronesia',               continent: 'OC', dialCode: '+691', phoneDigits: [7, 7] },
  { code: 'NR', name: 'Nauru',                    continent: 'OC', dialCode: '+674', phoneDigits: [4, 7] },
  { code: 'NZ', name: 'New Zealand',              continent: 'OC', dialCode: '+64',  phoneDigits: [8, 9] },
  { code: 'PW', name: 'Palau',                    continent: 'OC', dialCode: '+680', phoneDigits: [7, 7] },
  { code: 'PG', name: 'Papua New Guinea',         continent: 'OC', dialCode: '+675', phoneDigits: [7, 8] },
  { code: 'WS', name: 'Samoa',                    continent: 'OC', dialCode: '+685', phoneDigits: [5, 7] },
  { code: 'SB', name: 'Solomon Islands',          continent: 'OC', dialCode: '+677', phoneDigits: [5, 7] },
  { code: 'TO', name: 'Tonga',                    continent: 'OC', dialCode: '+676', phoneDigits: [5, 7] },
  { code: 'TV', name: 'Tuvalu',                   continent: 'OC', dialCode: '+688', phoneDigits: [5, 6] },
  { code: 'VU', name: 'Vanuatu',                  continent: 'OC', dialCode: '+678', phoneDigits: [5, 7] },

  // ── South America ─────────────────────────────────────────────────
  { code: 'AR', name: 'Argentina',                continent: 'SA', dialCode: '+54',  phoneDigits: [10, 11] },
  { code: 'BO', name: 'Bolivia',                  continent: 'SA', dialCode: '+591', phoneDigits: [8, 8] },
  { code: 'BR', name: 'Brazil',                   continent: 'SA', dialCode: '+55',  phoneDigits: [10, 11] },
  { code: 'CL', name: 'Chile',                    continent: 'SA', dialCode: '+56',  phoneDigits: [9, 9] },
  { code: 'CO', name: 'Colombia',                 continent: 'SA', dialCode: '+57',  phoneDigits: [10, 10] },
  { code: 'EC', name: 'Ecuador',                  continent: 'SA', dialCode: '+593', phoneDigits: [9, 9] },
  { code: 'GY', name: 'Guyana',                   continent: 'SA', dialCode: '+592', phoneDigits: [7, 7] },
  { code: 'PY', name: 'Paraguay',                 continent: 'SA', dialCode: '+595', phoneDigits: [9, 9] },
  { code: 'PE', name: 'Peru',                     continent: 'SA', dialCode: '+51',  phoneDigits: [9, 9] },
  { code: 'SR', name: 'Suriname',                 continent: 'SA', dialCode: '+597', phoneDigits: [6, 7] },
  { code: 'UY', name: 'Uruguay',                  continent: 'SA', dialCode: '+598', phoneDigits: [8, 8] },
  { code: 'VE', name: 'Venezuela',                continent: 'SA', dialCode: '+58',  phoneDigits: [10, 10] },
] satisfies Country[] as Country[];
COUNTRIES.sort((a, b) => a.name.localeCompare(b.name));

// Sexe (biologique) — 2 options seulement
export const GENDERS = [
  { code: 'male',   en: 'Male',   fr: 'Mâle'   },
  { code: 'female', en: 'Female', fr: 'Femelle' },
] as const;

export type GenderCode = typeof GENDERS[number]['code'];

export function getCountryData(countryCode: string): Country | undefined {
  return COUNTRIES.find(c => c.code === countryCode);
}

export function getContinentFromCountry(countryCode: string): string | null {
  return getCountryData(countryCode)?.continent ?? null;
}

export function getDialCode(countryCode: string): string | null {
  return getCountryData(countryCode)?.dialCode ?? null;
}

export function countryFlag(isoCode: string): string {
  return [...isoCode.toUpperCase()].map(c =>
    String.fromCodePoint(c.charCodeAt(0) + 127397)
  ).join('');
}
