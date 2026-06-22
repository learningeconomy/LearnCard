/* eslint-disable */
import * as registry from '../registry.js'
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Developerportal_Dashboards_Tabs_Overview_Templatecount2Inputs */

const en_developerportal_dashboards_tabs_overview_templatecount2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Overview_Templatecount2Inputs) => LocalizedString} */ (i) => {const countPlural = registry.plural("en", i?.count, {});
	if (countPlural === "one") return /** @type {LocalizedString} */ (`${i?.count} credential template`);
	if (countPlural === "other") return /** @type {LocalizedString} */ (`${i?.count} credential templates`);
	return /** @type {LocalizedString} */ (`${i?.count} credential templates`)
	
};

const es_developerportal_dashboards_tabs_overview_templatecount2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Overview_Templatecount2Inputs) => LocalizedString} */ (i) => {const countPlural = registry.plural("es", i?.count, {});
	if (countPlural === "one") return /** @type {LocalizedString} */ (`${i?.count} plantilla de credencial`);
	if (countPlural === "other") return /** @type {LocalizedString} */ (`${i?.count} plantillas de credenciales`);
	return /** @type {LocalizedString} */ (`${i?.count} plantillas de credenciales`)
	
};

const fr_developerportal_dashboards_tabs_overview_templatecount2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Overview_Templatecount2Inputs) => LocalizedString} */ (i) => {const countPlural = registry.plural("fr", i?.count, {});
	if (countPlural === "one") return /** @type {LocalizedString} */ (`${i?.count} modèle de credential`);
	if (countPlural === "other") return /** @type {LocalizedString} */ (`${i?.count} modèles de credentials`);
	return /** @type {LocalizedString} */ (`${i?.count} modèles de credentials`)
	
};

const ar_developerportal_dashboards_tabs_overview_templatecount2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Overview_Templatecount2Inputs) => LocalizedString} */ (i) => {const countPlural = registry.plural("ar", i?.count, {});
	if (countPlural === "one") return /** @type {LocalizedString} */ (`${i?.count} قالب بيانات اعتماد`);
	if (countPlural === "other") return /** @type {LocalizedString} */ (`${i?.count} قالب بيانات اعتماد`);
	return /** @type {LocalizedString} */ (`${i?.count} قالب بيانات اعتماد`)
	
};

/**
* | countPlural | output |
* | --- | --- |
* | "one" | "{count} credential template" |
* | "other" | "{count} credential templates" |
* | * | "{count} credential templates" |
*
* @param {Developerportal_Dashboards_Tabs_Overview_Templatecount2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_overview_templatecount2 = /** @type {((inputs: Developerportal_Dashboards_Tabs_Overview_Templatecount2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Overview_Templatecount2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_overview_templatecount2(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_overview_templatecount2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_overview_templatecount2(inputs)
	return ar_developerportal_dashboards_tabs_overview_templatecount2(inputs)
});
export { developerportal_dashboards_tabs_overview_templatecount2 as "developerPortal.dashboards.tabs.overview.templateCount" }