# BoostGetPaginatedBoostRecipientsWithChildren200ResponseRecordsInner


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**to** | [**BoostGetPaginatedBoostRecipients200ResponseRecordsInnerTo**](BoostGetPaginatedBoostRecipients200ResponseRecordsInnerTo.md) |  | 
**var_from** | **str** |  | 
**received** | **str** |  | [optional] 
**boost_uris** | **List[str]** |  | 
**credential_uris** | **List[str]** |  | [optional] 

## Example

```python
from openapi_client.models.boost_get_paginated_boost_recipients_with_children200_response_records_inner import BoostGetPaginatedBoostRecipientsWithChildren200ResponseRecordsInner

# TODO update the JSON string below
json = "{}"
# create an instance of BoostGetPaginatedBoostRecipientsWithChildren200ResponseRecordsInner from a JSON string
boost_get_paginated_boost_recipients_with_children200_response_records_inner_instance = BoostGetPaginatedBoostRecipientsWithChildren200ResponseRecordsInner.from_json(json)
# print the JSON string representation of the object
print(BoostGetPaginatedBoostRecipientsWithChildren200ResponseRecordsInner.to_json())

# convert the object into a dict
boost_get_paginated_boost_recipients_with_children200_response_records_inner_dict = boost_get_paginated_boost_recipients_with_children200_response_records_inner_instance.to_dict()
# create an instance of BoostGetPaginatedBoostRecipientsWithChildren200ResponseRecordsInner from a dict
boost_get_paginated_boost_recipients_with_children200_response_records_inner_from_dict = BoostGetPaginatedBoostRecipientsWithChildren200ResponseRecordsInner.from_dict(boost_get_paginated_boost_recipients_with_children200_response_records_inner_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


