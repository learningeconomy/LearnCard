# BoostGetPaginatedBoosts200ResponseRecordsInner


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**uri** | **str** |  | 
**name** | **str** |  | [optional] 
**type** | **str** |  | [optional] 
**category** | **str** |  | [optional] 
**status** | **str** |  | [optional] 
**auto_connect_recipients** | **bool** |  | [optional] 
**meta** | **Dict[str, object]** |  | [optional] 
**claim_permissions** | [**BoostGetBoost200ResponseClaimPermissions**](BoostGetBoost200ResponseClaimPermissions.md) |  | [optional] 
**allow_anyone_to_create_children** | **bool** |  | [optional] 

## Example

```python
from openapi_client.models.boost_get_paginated_boosts200_response_records_inner import BoostGetPaginatedBoosts200ResponseRecordsInner

# TODO update the JSON string below
json = "{}"
# create an instance of BoostGetPaginatedBoosts200ResponseRecordsInner from a JSON string
boost_get_paginated_boosts200_response_records_inner_instance = BoostGetPaginatedBoosts200ResponseRecordsInner.from_json(json)
# print the JSON string representation of the object
print(BoostGetPaginatedBoosts200ResponseRecordsInner.to_json())

# convert the object into a dict
boost_get_paginated_boosts200_response_records_inner_dict = boost_get_paginated_boosts200_response_records_inner_instance.to_dict()
# create an instance of BoostGetPaginatedBoosts200ResponseRecordsInner from a dict
boost_get_paginated_boosts200_response_records_inner_from_dict = BoostGetPaginatedBoosts200ResponseRecordsInner.from_dict(boost_get_paginated_boosts200_response_records_inner_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


