/* eslint-disable */
import * as registry from '../registry.js'
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Developerportal_Dashboards_Tabs_Overview_Tokencount2Inputs */

const en_developerportal_dashboards_tabs_overview_tokencount2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Overview_Tokencount2Inputs) => LocalizedString} */ (i) => {const countPlural = registry.plural("en", i?.count, {});
	if (countPlural === "one") return /** @type {LocalizedString} */ (`${i?.count} active token`);
	if (countPlural === "other") return /** @type {LocalizedString} */ (`${i?.count} active tokens`);
	return /** @type {LocalizedString} */ (`${i?.count} active tokens`)
	
};

const es_developerportal_dashboards_tabs_overview_tokencount2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Overview_Tokencount2Inputs) => LocalizedString} */ (i) => {const countPlural = registry.plural("es", i?.count, {});
	if (countPlural === "one") return /** @type {LocalizedString} */ (`${i?.count} token activo`);
	if (countPlural === "other") return /** @type {LocalizedString} */ (`${i?.count} tokens activos`);
	return /** @type {LocalizedString} */ (`${i?.count} tokens activos`)
	
};

const fr_developerportal_dashboards_tabs_overview_tokencount2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Overview_Tokencount2Inputs) => LocalizedString} */ (i) => {const countPlural = registry.plural("fr", i?.count, {});
	if (countPlural === "one") return /** @type {LocalizedString} */ (`${i?.count} jeton actif`);
	if (countPlural === "other") return /** @type {LocalizedString} */ (`${i?.count} jetons actifs`);
	return /** @type {LocalizedString} */ (`${i?.count} jetons actifs`)
	
};

const ar_developerportal_dashboards_tabs_overview_tokencount2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Overview_Tokencount2Inputs) => LocalizedString} */ (i) => {const countPlural = registry.plural("ar", i?.count, {});
	if (countPlural === "one") return /** @type {LocalizedString} */ (`${i?.count} رمز نشط`);
	if (countPlural === "other") return /** @type {LocalizedString} */ (`${i?.count} رمز نشط`);
	return /** @type {LocalizedString} */ (`${i?.count} رمز نشط`)
	
};

/**
* | countPlural | output |
* | --- | --- |
* | "one" | "{count} active token" |
* | "other" | "{count} active tokens" |
* | * | "{count} active tokens" |
*
* @param {Developerportal_Dashboards_Tabs_Overview_Tokencount2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_overview_tokencount2 = /** @type {((inputs: Developerportal_Dashboards_Tabs_Overview_Tokencount2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Overview_Tokencount2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_overview_tokencount2(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_overview_tokencount2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_overview_tokencount2(inputs)
	return ar_developerportal_dashboards_tabs_overview_tokencount2(inputs)
});
export { developerportal_dashboards_tabs_overview_tokencount2 as "developerPortal.dashboards.tabs.overview.tokenCount" }