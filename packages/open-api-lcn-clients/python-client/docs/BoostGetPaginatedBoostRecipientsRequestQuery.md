# BoostGetPaginatedBoostRecipientsRequestQuery


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**profile_id** | [**BoostSearchSkillsAvailableForBoostRequestQueryAnyOfOrInnerId**](BoostSearchSkillsAvailableForBoostRequestQueryAnyOfOrInnerId.md) |  | [optional] 
**display_name** | [**BoostSearchSkillsAvailableForBoostRequestQueryAnyOfOrInnerId**](BoostSearchSkillsAvailableForBoostRequestQueryAnyOfOrInnerId.md) |  | [optional] 
**short_bio** | [**BoostSearchSkillsAvailableForBoostRequestQueryAnyOfOrInnerId**](BoostSearchSkillsAvailableForBoostRequestQueryAnyOfOrInnerId.md) |  | [optional] 
**bio** | [**BoostSearchSkillsAvailableForBoostRequestQueryAnyOfOrInnerId**](BoostSearchSkillsAvailableForBoostRequestQueryAnyOfOrInnerId.md) |  | [optional] 
**email** | [**BoostSearchSkillsAvailableForBoostRequestQueryAnyOfOrInnerId**](BoostSearchSkillsAvailableForBoostRequestQueryAnyOfOrInnerId.md) |  | [optional] 
**website_link** | [**BoostSearchSkillsAvailableForBoostRequestQueryAnyOfOrInnerId**](BoostSearchSkillsAvailableForBoostRequestQueryAnyOfOrInnerId.md) |  | [optional] 
**is_service_profile** | **bool** |  | [optional] 
**type** | [**BoostSearchSkillsAvailableForBoostRequestQueryAnyOfOrInnerId**](BoostSearchSkillsAvailableForBoostRequestQueryAnyOfOrInnerId.md) |  | [optional] 

## Example

```python
from openapi_client.models.boost_get_paginated_boost_recipients_request_query import BoostGetPaginatedBoostRecipientsRequestQuery

# TODO update the JSON string below
json = "{}"
# create an instance of BoostGetPaginatedBoostRecipientsRequestQuery from a JSON string
boost_get_paginated_boost_recipients_request_query_instance = BoostGetPaginatedBoostRecipientsRequestQuery.from_json(json)
# print the JSON string representation of the object
print(BoostGetPaginatedBoostRecipientsRequestQuery.to_json())

# convert the object into a dict
boost_get_paginated_boost_recipients_request_query_dict = boost_get_paginated_boost_recipients_request_query_instance.to_dict()
# create an instance of BoostGetPaginatedBoostRecipientsRequestQuery from a dict
boost_get_paginated_boost_recipients_request_query_from_dict = BoostGetPaginatedBoostRecipientsRequestQuery.from_dict(boost_get_paginated_boost_recipients_request_query_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


