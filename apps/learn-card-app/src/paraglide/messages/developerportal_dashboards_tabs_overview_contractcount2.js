/* eslint-disable */
import * as registry from '../registry.js'
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Developerportal_Dashboards_Tabs_Overview_Contractcount2Inputs */

const en_developerportal_dashboards_tabs_overview_contractcount2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Overview_Contractcount2Inputs) => LocalizedString} */ (i) => {const countPlural = registry.plural("en", i?.count, {});
	if (countPlural === "one") return /** @type {LocalizedString} */ (`${i?.count} active contract`);
	if (countPlural === "other") return /** @type {LocalizedString} */ (`${i?.count} active contracts`);
	return /** @type {LocalizedString} */ (`${i?.count} active contracts`)
	
};

const es_developerportal_dashboards_tabs_overview_contractcount2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Overview_Contractcount2Inputs) => LocalizedString} */ (i) => {const countPlural = registry.plural("es", i?.count, {});
	if (countPlural === "one") return /** @type {LocalizedString} */ (`${i?.count} contrato activo`);
	if (countPlural === "other") return /** @type {LocalizedString} */ (`${i?.count} contratos activos`);
	return /** @type {LocalizedString} */ (`${i?.count} contratos activos`)
	
};

const fr_developerportal_dashboards_tabs_overview_contractcount2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Overview_Contractcount2Inputs) => LocalizedString} */ (i) => {const countPlural = registry.plural("fr", i?.count, {});
	if (countPlural === "one") return /** @type {LocalizedString} */ (`${i?.count} contrat actif`);
	if (countPlural === "other") return /** @type {LocalizedString} */ (`${i?.count} contrats actifs`);
	return /** @type {LocalizedString} */ (`${i?.count} contrats actifs`)
	
};

const ar_developerportal_dashboards_tabs_overview_contractcount2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Overview_Contractcount2Inputs) => LocalizedString} */ (i) => {const countPlural = registry.plural("ar", i?.count, {});
	if (countPlural === "one") return /** @type {LocalizedString} */ (`${i?.count} عقد نشط`);
	if (countPlural === "other") return /** @type {LocalizedString} */ (`${i?.count} عقد نشط`);
	return /** @type {LocalizedString} */ (`${i?.count} عقد نشط`)
	
};

/**
* | countPlural | output |
* | --- | --- |
* | "one" | "{count} active contract" |
* | "other" | "{count} active contracts" |
* | * | "{count} active contracts" |
*
* @param {Developerportal_Dashboards_Tabs_Overview_Contractcount2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_overview_contractcount2 = /** @type {((inputs: Developerportal_Dashboards_Tabs_Overview_Contractcount2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Overview_Contractcount2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_overview_contractcount2(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_overview_contractcount2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_overview_contractcount2(inputs)
	return ar_developerportal_dashboards_tabs_overview_contractcount2(inputs)
});
export { developerportal_dashboards_tabs_overview_contractcount2 as "developerPortal.dashboards.tabs.overview.contractCount" }