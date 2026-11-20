# BoostGetPaginatedBoostsRequestExclude

## Properties

| Name         | Type                                                                                                                                          | Description | Notes      |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ---------- |
| **name**     | [**BoostSearchSkillsAvailableForBoostRequestQueryAnyOfOrInnerIdAnyOf**](BoostSearchSkillsAvailableForBoostRequestQueryAnyOfOrInnerIdAnyOf.md) |             | [optional] |
| **category** | [**BoostSearchSkillsAvailableForBoostRequestQueryAnyOfOrInnerIdAnyOf**](BoostSearchSkillsAvailableForBoostRequestQueryAnyOfOrInnerIdAnyOf.md) |             | [optional] |

## Example

```python
from openapi_client.models.boost_get_paginated_boosts_request_exclude import BoostGetPaginatedBoostsRequestExclude

# TODO update the JSON string below
json = "{}"
# create an instance of BoostGetPaginatedBoostsRequestExclude from a JSON string
boost_get_paginated_boosts_request_exclude_instance = BoostGetPaginatedBoostsRequestExclude.from_json(json)
# print the JSON string representation of the object
print(BoostGetPaginatedBoostsRequestExclude.to_json())

# convert the object into a dict
boost_get_paginated_boosts_request_exclude_dict = boost_get_paginated_boosts_request_exclude_instance.to_dict()
# create an instance of BoostGetPaginatedBoostsRequestExclude from a dict
boost_get_paginated_boosts_request_exclude_from_dict = BoostGetPaginatedBoostsRequestExclude.from_dict(boost_get_paginated_boosts_request_exclude_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
