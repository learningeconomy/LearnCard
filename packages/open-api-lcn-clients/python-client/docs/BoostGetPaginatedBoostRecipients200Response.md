# BoostGetPaginatedBoostRecipients200Response


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**cursor** | **str** |  | [optional] 
**has_more** | **bool** |  | 
**records** | [**List[BoostGetBoostRecipients200ResponseInner]**](BoostGetBoostRecipients200ResponseInner.md) |  | 

## Example

```python
from openapi_client.models.boost_get_paginated_boost_recipients200_response import BoostGetPaginatedBoostRecipients200Response

# TODO update the JSON string below
json = "{}"
# create an instance of BoostGetPaginatedBoostRecipients200Response from a JSON string
boost_get_paginated_boost_recipients200_response_instance = BoostGetPaginatedBoostRecipients200Response.from_json(json)
# print the JSON string representation of the object
print(BoostGetPaginatedBoostRecipients200Response.to_json())

# convert the object into a dict
boost_get_paginated_boost_recipients200_response_dict = boost_get_paginated_boost_recipients200_response_instance.to_dict()
# create an instance of BoostGetPaginatedBoostRecipients200Response from a dict
boost_get_paginated_boost_recipients200_response_from_dict = BoostGetPaginatedBoostRecipients200Response.from_dict(boost_get_paginated_boost_recipients200_response_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


