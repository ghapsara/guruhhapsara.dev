---
kind: post
published: true
title: Python Cheat Sheet
date: 2021-01-03T22:00:00.00Z
path: /python-cheat-sheet
tags:
  - python
  - pandas
  - numpy
description: >-
  supercool python snippets that supercharge my productivity.
background: "#f8ead0"
---

Lately I was involved in gitlab runner resources budgeting project in my team. I was inundated with a ridiculous amount of containers cpu and memory data. My job was to find under utilized container resources and adjust them accordingly. So I had to pull out insights from those data and have multiple discussions with my team.

I knew it would be all about analysis, I immediately pulled up my jupyter notebook, despite I don't use python regularly. I started listing things that I needed to do. Requirements were lining up, I knew what to do, this is going to be the best of the night, Let's jump right in.

But then things began to rattle a little bit when I forgot to do particular things in python. I forget how to subtract 2 datetimes, I don't remember how to read a file in python. I have to open my previous works which spill out in many different places just to remember these basic things. I got so fed up because I keep forgetting them every time I need them 😂.

So, here are my top heavily used python tricks.

<br/>

## Files

### Read a file

```python
with open("file.txt") as f:
   data=f.read()

print(data)
```

### Write to a file

```python
foo="bar"
with open("foo.txt", "w", encoding="utf-8") as f:
    f.write(foo)
```

### Read a json file

```python
import json
###
# file.json sample
# [{foo: "bar"}, {foo: "bar"}]
###

with open("file.json", "r") as f:
  file_json=json.loads(f)

for d in file_json:
  print(d["foo"])
```

<br/>

## Datetime

### Substract two dates

```python
# initializing a datime
to_date = datetime(2020, 12, 17, 23, 59)

# substract to_date by 10 days
from_date = (to_date - timedelta(days=10))

```

### Convert to Javascript Date (JSON Date)

When we want to convert a python datetime to a javascript date, we have to times the total seconds by 1000.
As `strftime` method formats a date into a string object,
one of the ways to have a correct json date is to append it with tripple zeros.
Or you can cast it into an integer then you multiply it by 1000.

```python
json_date = to_date.strftime("%s") + "000"

json_date = int(to_date.strftime("%s")) * 1000
```

<br/>

## Pandas

If you're currently working with spreadsheet or excel, I highly recommend you to start taking a look at pandas. Pandas is like a spreadsheet with powerful python data analysis tools upon it.

Pandas adoption is so fast. The veil between your ideas and the working code is so friggin' thin. This is the main reason why it is so convenient to use pandas whenever I need to do something with data.

These are magical pandas tricks that I use quite a lot and I love them so much.

### Functions

Apply a function to a column

```python
def func(param):
  return param

df.col.apply(lambda d: func(d))
df.col.apply(func)
```

Apply a function to multiple columns

```python
def func(df):
  return df["a"] + df["b"]

df.apply(func, axis=1)
```

### Sort values

It's surprising that we can sort a dataframe by multiple columns.

```python
df = df.sort_values('name')

df.sort_values(by=["col1", "col2"], ascending=False)
```

docs:

- https://pandas.pydata.org/pandas-docs/stable/reference/api/pandas.DataFrame.sort_values.html

### Count values

If you need a way to group a list with their total occurrences, this is one way to do it.

```python
df.col.value_counts()

df.col.value_counts(dropna=True)
```

docs:

- https://pandas.pydata.org/pandas-docs/stable/reference/api/pandas.Series.value_counts.html

### Join or Merge dataframes

Pandas is like a plot twist character who incites me to ditch SQL queries 😂. SQL queries can become quite intrusive when you keep adding more filters and calculations into them. Sometimes, I think to myself SQL queries are only fitted for applications needs.

```python
df_left = pd.DataFrame()
df_right = pd.DataFrame()

how = "left" | "right" | "inner" | "outer"
merged_df = pd.merge(df_left, df_right, left_on=["key"], right_on=["Key"], how=how)
```

docs:

- https://pandas.pydata.org/pandas-docs/stable/user_guide/merging.html

### Drop columns

```python
df.drop(["col", "col-1"], axis=1, inplace=True)
```

### Dealing with na / null values

```python
import pandas as pd

df.fillna('', inplace=True)

df.dropna(inplace=True)

df.isna()
df.col.isna()
```

docs :

- https://pandas.pydata.org/pandas-docs/stable/reference/api/pandas.DataFrame.isna.html#pandas.DataFrame.isna
- https://pandas.pydata.org/pandas-docs/stable/reference/api/pandas.DataFrame.dropna.html
- https://pandas.pydata.org/pandas-docs/stable/reference/api/pandas.DataFrame.isna.html#pandas.DataFrame.isna

<br/>

## Numpy

### Split an array to multiple arrays (Chunks)

```python
data=[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
chunks = np.array_split(data, 3)
print(chunks)
# [array([1, 2, 3, 4]), array([5, 6, 7]), array([ 8, 9, 10])]
```

<br/>

That's all folks, I hope you find them useful.
More snippets might be added to the list in the future.

Thanks for reading. <br/>
See you in the next post.
