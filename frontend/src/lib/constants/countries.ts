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
}

export const COUNTRIES: Country[] = [
  // ── Africa ────────────────────────────────────────────────────────
  { code: 'DZ', name: 'Algeria',                  continent: 'AF', dialCode: '+213' },
  { code: 'AO', name: 'Angola',                   continent: 'AF', dialCode: '+244' },
  { code: 'BJ', name: 'Benin',                    continent: 'AF', dialCode: '+229' },
  { code: 'BW', name: 'Botswana',                 continent: 'AF', dialCode: '+267' },
  { code: 'BF', name: 'Burkina Faso',             continent: 'AF', dialCode: '+226' },
  { code: 'BI', name: 'Burundi',                  continent: 'AF', dialCode: '+257' },
  { code: 'CV', name: 'Cabo Verde',               continent: 'AF', dialCode: '+238' },
  { code: 'CM', name: 'Cameroon',                 continent: 'AF', dialCode: '+237' },
  { code: 'CF', name: 'Central African Republic', continent: 'AF', dialCode: '+236' },
  { code: 'TD', name: 'Chad',                     continent: 'AF', dialCode: '+235' },
  { code: 'KM', name: 'Comoros',                  continent: 'AF', dialCode: '+269' },
  { code: 'CG', name: 'Congo',                    continent: 'AF', dialCode: '+242' },
  { code: 'CD', name: 'Congo (DRC)',               continent: 'AF', dialCode: '+243' },
  { code: 'CI', name: "Côte d'Ivoire",            continent: 'AF', dialCode: '+225' },
  { code: 'DJ', name: 'Djibouti',                 continent: 'AF', dialCode: '+253' },
  { code: 'EG', name: 'Egypt',                    continent: 'AF', dialCode: '+20'  },
  { code: 'GQ', name: 'Equatorial Guinea',        continent: 'AF', dialCode: '+240' },
  { code: 'ER', name: 'Eritrea',                  continent: 'AF', dialCode: '+291' },
  { code: 'SZ', name: 'Eswatini',                 continent: 'AF', dialCode: '+268' },
  { code: 'ET', name: 'Ethiopia',                 continent: 'AF', dialCode: '+251' },
  { code: 'GA', name: 'Gabon',                    continent: 'AF', dialCode: '+241' },
  { code: 'GM', name: 'Gambia',                   continent: 'AF', dialCode: '+220' },
  { code: 'GH', name: 'Ghana',                    continent: 'AF', dialCode: '+233' },
  { code: 'GN', name: 'Guinea',                   continent: 'AF', dialCode: '+224' },
  { code: 'GW', name: 'Guinea-Bissau',            continent: 'AF', dialCode: '+245' },
  { code: 'KE', name: 'Kenya',                    continent: 'AF', dialCode: '+254' },
  { code: 'LS', name: 'Lesotho',                  continent: 'AF', dialCode: '+266' },
  { code: 'LR', name: 'Liberia',                  continent: 'AF', dialCode: '+231' },
  { code: 'LY', name: 'Libya',                    continent: 'AF', dialCode: '+218' },
  { code: 'MG', name: 'Madagascar',               continent: 'AF', dialCode: '+261' },
  { code: 'MW', name: 'Malawi',                   continent: 'AF', dialCode: '+265' },
  { code: 'ML', name: 'Mali',                     continent: 'AF', dialCode: '+223' },
  { code: 'MR', name: 'Mauritania',               continent: 'AF', dialCode: '+222' },
  { code: 'MU', name: 'Mauritius',                continent: 'AF', dialCode: '+230' },
  { code: 'MA', name: 'Morocco',                  continent: 'AF', dialCode: '+212' },
  { code: 'MZ', name: 'Mozambique',               continent: 'AF', dialCode: '+258' },
  { code: 'NA', name: 'Namibia',                  continent: 'AF', dialCode: '+264' },
  { code: 'NE', name: 'Niger',                    continent: 'AF', dialCode: '+227' },
  { code: 'NG', name: 'Nigeria',                  continent: 'AF', dialCode: '+234' },
  { code: 'RW', name: 'Rwanda',                   continent: 'AF', dialCode: '+250' },
  { code: 'ST', name: 'São Tomé and Príncipe',    continent: 'AF', dialCode: '+239' },
  { code: 'SN', name: 'Senegal',                  continent: 'AF', dialCode: '+221' },
  { code: 'SC', name: 'Seychelles',               continent: 'AF', dialCode: '+248' },
  { code: 'SL', name: 'Sierra Leone',             continent: 'AF', dialCode: '+232' },
  { code: 'SO', name: 'Somalia',                  continent: 'AF', dialCode: '+252' },
  { code: 'ZA', name: 'South Africa',             continent: 'AF', dialCode: '+27'  },
  { code: 'SS', name: 'South Sudan',              continent: 'AF', dialCode: '+211' },
  { code: 'SD', name: 'Sudan',                    continent: 'AF', dialCode: '+249' },
  { code: 'TZ', name: 'Tanzania',                 continent: 'AF', dialCode: '+255' },
  { code: 'TG', name: 'Togo',                     continent: 'AF', dialCode: '+228' },
  { code: 'TN', name: 'Tunisia',                  continent: 'AF', dialCode: '+216' },
  { code: 'UG', name: 'Uganda',                   continent: 'AF', dialCode: '+256' },
  { code: 'ZM', name: 'Zambia',                   continent: 'AF', dialCode: '+260' },
  { code: 'ZW', name: 'Zimbabwe',                 continent: 'AF', dialCode: '+263' },

  // ── Antarctica ────────────────────────────────────────────────────
  { code: 'AQ', name: 'Antarctica',               continent: 'AN', dialCode: '+672' },

  // ── Asia ──────────────────────────────────────────────────────────
  { code: 'AF', name: 'Afghanistan',              continent: 'AS', dialCode: '+93'  },
  { code: 'AM', name: 'Armenia',                  continent: 'AS', dialCode: '+374' },
  { code: 'AZ', name: 'Azerbaijan',               continent: 'AS', dialCode: '+994' },
  { code: 'BH', name: 'Bahrain',                  continent: 'AS', dialCode: '+973' },
  { code: 'BD', name: 'Bangladesh',               continent: 'AS', dialCode: '+880' },
  { code: 'BT', name: 'Bhutan',                   continent: 'AS', dialCode: '+975' },
  { code: 'BN', name: 'Brunei',                   continent: 'AS', dialCode: '+673' },
  { code: 'KH', name: 'Cambodia',                 continent: 'AS', dialCode: '+855' },
  { code: 'CN', name: 'China',                    continent: 'AS', dialCode: '+86'  },
  { code: 'CY', name: 'Cyprus',                   continent: 'AS', dialCode: '+357' },
  { code: 'GE', name: 'Georgia',                  continent: 'AS', dialCode: '+995' },
  { code: 'IN', name: 'India',                    continent: 'AS', dialCode: '+91'  },
  { code: 'ID', name: 'Indonesia',                continent: 'AS', dialCode: '+62'  },
  { code: 'IR', name: 'Iran',                     continent: 'AS', dialCode: '+98'  },
  { code: 'IQ', name: 'Iraq',                     continent: 'AS', dialCode: '+964' },
  { code: 'IL', name: 'Israel',                   continent: 'AS', dialCode: '+972' },
  { code: 'JP', name: 'Japan',                    continent: 'AS', dialCode: '+81'  },
  { code: 'JO', name: 'Jordan',                   continent: 'AS', dialCode: '+962' },
  { code: 'KZ', name: 'Kazakhstan',               continent: 'AS', dialCode: '+7'   },
  { code: 'KW', name: 'Kuwait',                   continent: 'AS', dialCode: '+965' },
  { code: 'KG', name: 'Kyrgyzstan',               continent: 'AS', dialCode: '+996' },
  { code: 'LA', name: 'Laos',                     continent: 'AS', dialCode: '+856' },
  { code: 'LB', name: 'Lebanon',                  continent: 'AS', dialCode: '+961' },
  { code: 'MY', name: 'Malaysia',                 continent: 'AS', dialCode: '+60'  },
  { code: 'MV', name: 'Maldives',                 continent: 'AS', dialCode: '+960' },
  { code: 'MN', name: 'Mongolia',                 continent: 'AS', dialCode: '+976' },
  { code: 'MM', name: 'Myanmar',                  continent: 'AS', dialCode: '+95'  },
  { code: 'NP', name: 'Nepal',                    continent: 'AS', dialCode: '+977' },
  { code: 'KP', name: 'North Korea',              continent: 'AS', dialCode: '+850' },
  { code: 'OM', name: 'Oman',                     continent: 'AS', dialCode: '+968' },
  { code: 'PK', name: 'Pakistan',                 continent: 'AS', dialCode: '+92'  },
  { code: 'PS', name: 'Palestine',                continent: 'AS', dialCode: '+970' },
  { code: 'PH', name: 'Philippines',              continent: 'AS', dialCode: '+63'  },
  { code: 'QA', name: 'Qatar',                    continent: 'AS', dialCode: '+974' },
  { code: 'SA', name: 'Saudi Arabia',             continent: 'AS', dialCode: '+966' },
  { code: 'SG', name: 'Singapore',                continent: 'AS', dialCode: '+65'  },
  { code: 'KR', name: 'South Korea',              continent: 'AS', dialCode: '+82'  },
  { code: 'LK', name: 'Sri Lanka',                continent: 'AS', dialCode: '+94'  },
  { code: 'SY', name: 'Syria',                    continent: 'AS', dialCode: '+963' },
  { code: 'TW', name: 'Taiwan',                   continent: 'AS', dialCode: '+886' },
  { code: 'TJ', name: 'Tajikistan',               continent: 'AS', dialCode: '+992' },
  { code: 'TH', name: 'Thailand',                 continent: 'AS', dialCode: '+66'  },
  { code: 'TL', name: 'Timor-Leste',              continent: 'AS', dialCode: '+670' },
  { code: 'TR', name: 'Turkey',                   continent: 'AS', dialCode: '+90'  },
  { code: 'TM', name: 'Turkmenistan',             continent: 'AS', dialCode: '+993' },
  { code: 'AE', name: 'United Arab Emirates',     continent: 'AS', dialCode: '+971' },
  { code: 'UZ', name: 'Uzbekistan',               continent: 'AS', dialCode: '+998' },
  { code: 'VN', name: 'Vietnam',                  continent: 'AS', dialCode: '+84'  },
  { code: 'YE', name: 'Yemen',                    continent: 'AS', dialCode: '+967' },

  // ── Europe ────────────────────────────────────────────────────────
  { code: 'AL', name: 'Albania',                  continent: 'EU', dialCode: '+355' },
  { code: 'AD', name: 'Andorra',                  continent: 'EU', dialCode: '+376' },
  { code: 'AT', name: 'Austria',                  continent: 'EU', dialCode: '+43'  },
  { code: 'BY', name: 'Belarus',                  continent: 'EU', dialCode: '+375' },
  { code: 'BE', name: 'Belgium',                  continent: 'EU', dialCode: '+32'  },
  { code: 'BA', name: 'Bosnia and Herzegovina',   continent: 'EU', dialCode: '+387' },
  { code: 'BG', name: 'Bulgaria',                 continent: 'EU', dialCode: '+359' },
  { code: 'HR', name: 'Croatia',                  continent: 'EU', dialCode: '+385' },
  { code: 'CZ', name: 'Czech Republic',           continent: 'EU', dialCode: '+420' },
  { code: 'DK', name: 'Denmark',                  continent: 'EU', dialCode: '+45'  },
  { code: 'EE', name: 'Estonia',                  continent: 'EU', dialCode: '+372' },
  { code: 'FI', name: 'Finland',                  continent: 'EU', dialCode: '+358' },
  { code: 'FR', name: 'France',                   continent: 'EU', dialCode: '+33'  },
  { code: 'DE', name: 'Germany',                  continent: 'EU', dialCode: '+49'  },
  { code: 'GR', name: 'Greece',                   continent: 'EU', dialCode: '+30'  },
  { code: 'HU', name: 'Hungary',                  continent: 'EU', dialCode: '+36'  },
  { code: 'IS', name: 'Iceland',                  continent: 'EU', dialCode: '+354' },
  { code: 'IE', name: 'Ireland',                  continent: 'EU', dialCode: '+353' },
  { code: 'IT', name: 'Italy',                    continent: 'EU', dialCode: '+39'  },
  { code: 'XK', name: 'Kosovo',                   continent: 'EU', dialCode: '+383' },
  { code: 'LV', name: 'Latvia',                   continent: 'EU', dialCode: '+371' },
  { code: 'LI', name: 'Liechtenstein',            continent: 'EU', dialCode: '+423' },
  { code: 'LT', name: 'Lithuania',                continent: 'EU', dialCode: '+370' },
  { code: 'LU', name: 'Luxembourg',               continent: 'EU', dialCode: '+352' },
  { code: 'MT', name: 'Malta',                    continent: 'EU', dialCode: '+356' },
  { code: 'MD', name: 'Moldova',                  continent: 'EU', dialCode: '+373' },
  { code: 'MC', name: 'Monaco',                   continent: 'EU', dialCode: '+377' },
  { code: 'ME', name: 'Montenegro',               continent: 'EU', dialCode: '+382' },
  { code: 'NL', name: 'Netherlands',              continent: 'EU', dialCode: '+31'  },
  { code: 'MK', name: 'North Macedonia',          continent: 'EU', dialCode: '+389' },
  { code: 'NO', name: 'Norway',                   continent: 'EU', dialCode: '+47'  },
  { code: 'PL', name: 'Poland',                   continent: 'EU', dialCode: '+48'  },
  { code: 'PT', name: 'Portugal',                 continent: 'EU', dialCode: '+351' },
  { code: 'RO', name: 'Romania',                  continent: 'EU', dialCode: '+40'  },
  { code: 'RU', name: 'Russia',                   continent: 'EU', dialCode: '+7'   },
  { code: 'SM', name: 'San Marino',               continent: 'EU', dialCode: '+378' },
  { code: 'RS', name: 'Serbia',                   continent: 'EU', dialCode: '+381' },
  { code: 'SK', name: 'Slovakia',                 continent: 'EU', dialCode: '+421' },
  { code: 'SI', name: 'Slovenia',                 continent: 'EU', dialCode: '+386' },
  { code: 'ES', name: 'Spain',                    continent: 'EU', dialCode: '+34'  },
  { code: 'SE', name: 'Sweden',                   continent: 'EU', dialCode: '+46'  },
  { code: 'CH', name: 'Switzerland',              continent: 'EU', dialCode: '+41'  },
  { code: 'UA', name: 'Ukraine',                  continent: 'EU', dialCode: '+380' },
  { code: 'GB', name: 'United Kingdom',           continent: 'EU', dialCode: '+44'  },
  { code: 'VA', name: 'Vatican City',             continent: 'EU', dialCode: '+379' },

  // ── North America ─────────────────────────────────────────────────
  { code: 'AG', name: 'Antigua and Barbuda',      continent: 'NA', dialCode: '+1'   },
  { code: 'BS', name: 'Bahamas',                  continent: 'NA', dialCode: '+1'   },
  { code: 'BB', name: 'Barbados',                 continent: 'NA', dialCode: '+1'   },
  { code: 'BZ', name: 'Belize',                   continent: 'NA', dialCode: '+501' },
  { code: 'CA', name: 'Canada',                   continent: 'NA', dialCode: '+1'   },
  { code: 'CR', name: 'Costa Rica',               continent: 'NA', dialCode: '+506' },
  { code: 'CU', name: 'Cuba',                     continent: 'NA', dialCode: '+53'  },
  { code: 'DM', name: 'Dominica',                 continent: 'NA', dialCode: '+1'   },
  { code: 'DO', name: 'Dominican Republic',       continent: 'NA', dialCode: '+1'   },
  { code: 'SV', name: 'El Salvador',              continent: 'NA', dialCode: '+503' },
  { code: 'GD', name: 'Grenada',                  continent: 'NA', dialCode: '+1'   },
  { code: 'GT', name: 'Guatemala',                continent: 'NA', dialCode: '+502' },
  { code: 'HT', name: 'Haiti',                    continent: 'NA', dialCode: '+509' },
  { code: 'HN', name: 'Honduras',                 continent: 'NA', dialCode: '+504' },
  { code: 'JM', name: 'Jamaica',                  continent: 'NA', dialCode: '+1'   },
  { code: 'MX', name: 'Mexico',                   continent: 'NA', dialCode: '+52'  },
  { code: 'NI', name: 'Nicaragua',                continent: 'NA', dialCode: '+505' },
  { code: 'PA', name: 'Panama',                   continent: 'NA', dialCode: '+507' },
  { code: 'KN', name: 'Saint Kitts and Nevis',    continent: 'NA', dialCode: '+1'   },
  { code: 'LC', name: 'Saint Lucia',              continent: 'NA', dialCode: '+1'   },
  { code: 'VC', name: 'Saint Vincent',            continent: 'NA', dialCode: '+1'   },
  { code: 'TT', name: 'Trinidad and Tobago',      continent: 'NA', dialCode: '+1'   },
  { code: 'US', name: 'United States',            continent: 'NA', dialCode: '+1'   },

  // ── Oceania ───────────────────────────────────────────────────────
  { code: 'AU', name: 'Australia',                continent: 'OC', dialCode: '+61'  },
  { code: 'FJ', name: 'Fiji',                     continent: 'OC', dialCode: '+679' },
  { code: 'KI', name: 'Kiribati',                 continent: 'OC', dialCode: '+686' },
  { code: 'MH', name: 'Marshall Islands',         continent: 'OC', dialCode: '+692' },
  { code: 'FM', name: 'Micronesia',               continent: 'OC', dialCode: '+691' },
  { code: 'NR', name: 'Nauru',                    continent: 'OC', dialCode: '+674' },
  { code: 'NZ', name: 'New Zealand',              continent: 'OC', dialCode: '+64'  },
  { code: 'PW', name: 'Palau',                    continent: 'OC', dialCode: '+680' },
  { code: 'PG', name: 'Papua New Guinea',         continent: 'OC', dialCode: '+675' },
  { code: 'WS', name: 'Samoa',                    continent: 'OC', dialCode: '+685' },
  { code: 'SB', name: 'Solomon Islands',          continent: 'OC', dialCode: '+677' },
  { code: 'TO', name: 'Tonga',                    continent: 'OC', dialCode: '+676' },
  { code: 'TV', name: 'Tuvalu',                   continent: 'OC', dialCode: '+688' },
  { code: 'VU', name: 'Vanuatu',                  continent: 'OC', dialCode: '+678' },

  // ── South America ─────────────────────────────────────────────────
  { code: 'AR', name: 'Argentina',                continent: 'SA', dialCode: '+54'  },
  { code: 'BO', name: 'Bolivia',                  continent: 'SA', dialCode: '+591' },
  { code: 'BR', name: 'Brazil',                   continent: 'SA', dialCode: '+55'  },
  { code: 'CL', name: 'Chile',                    continent: 'SA', dialCode: '+56'  },
  { code: 'CO', name: 'Colombia',                 continent: 'SA', dialCode: '+57'  },
  { code: 'EC', name: 'Ecuador',                  continent: 'SA', dialCode: '+593' },
  { code: 'GY', name: 'Guyana',                   continent: 'SA', dialCode: '+592' },
  { code: 'PY', name: 'Paraguay',                 continent: 'SA', dialCode: '+595' },
  { code: 'PE', name: 'Peru',                     continent: 'SA', dialCode: '+51'  },
  { code: 'SR', name: 'Suriname',                 continent: 'SA', dialCode: '+597' },
  { code: 'UY', name: 'Uruguay',                  continent: 'SA', dialCode: '+598' },
  { code: 'VE', name: 'Venezuela',                continent: 'SA', dialCode: '+58'  },
].sort((a, b) => a.name.localeCompare(b.name));

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
