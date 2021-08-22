---
kind: blog
published: true
title: Placing Bets On Maintaining Application Longevity
date: 2021-02-07T00:00:00.00Z
path: /placing-bets-on-maintaining-application-longevity
tags:
  - golang
  - refactoring
  - bot
description: >-
  This time I want to share my tears and joy of maintaining a golang bot application. We're going to talk about a gigantic refactoring, it's almost like a complete rewrite.
background: "#B8EBF1"
---

I know when you hear the word rewrite you'll be like this guy is instigating an insurgency warfare. There were reasons that made us crushing with this option. We'll talk about that later.

So, first of all, let me give you a little context of what we did.

You might ask, why do you say we? The reason for that is because I didn't do this alone, it was not a self narcissistic work.

So, I'm working for a deployment tooling team. Our job is mainly helping engineers in our company to get their applications or services to production.

My team is handling a bot that is responsible for deploying a huge monolithic code base that has been living for more than 11 years. There are almost like 500 engineers across different teams contributing to the code base. Nevertheless, we're (not my team) currently working on migrating this large code base to microservices.

So, This bot plays a certain role to the running business.

It's a handy crafted bot application assembled by a collaboration between SREs and Software Engineers, and bunch of people from across engineering teams also put their hands into the code base. Everybody can contribute anytime they want, everybody can implement any requirements for the bot. Everybody is like can I do this, can i have that, can we have this, what if we do this with this bot. That's the kind of discussions happening in the bot development.

The code arrived to a point where it became very difficult to expand. There were a few couple of files inundated with more than 1000 lines of code. Testing was super intricate. Introducing new changes to the code base became very frightening.

Reading the bot's code was like walking in a labyrinth where you have to carefully make few strides to get to the final gate. Doors are all open, but they can lead you to a wrong destination. As you move gingerly to a particular door, you'll find new doors, and then when you're stepping into one of these doors, you'll get excited and you'll think you're going to arrive to the final gate, but nope, you'll meet new doors again.

This is tumultuous. It's very difficult to know what each of parts of the code are exactly doing. A method could have multiple separated functions which subscribe and exploit (this is just a fun word to pick, but you know what I mean) the application's state.

Knowing this problem, we decided to invest some of our resources in preventing this pernicious radioactive leaking to a wider space.

# Our process

- Identify symptoms
- List viable solutions
- Gradual refactors
- Adding more tests
- Safely deploy tiny code changes to production

That didn't happen 😂

It's true, I'm not kidding.

We were screwed up with those conditions and yet we only had 3 months to work on. With this super short development time in mind, we realized that a safe and cautious implementation won't fit to our timeline. We crushed the battleship with this approach instead.

> Rewriting code structure with minimum necessary code changes and increasing test coverages progressively.

This was like a quote we had on our t-shirt when we were working.

# The work

Of course, It's not that simple. We went back and forth in designing and messing up the code structure. We did take a look at a few couple of design patterns. We mapped each one of them into our use case, but none of them satisfied with the conditions and expectations we had. We didn't invent a new design pattern. We came up with a go basic package approach. We started putting works to the part of code which we considered to be the "hurdle".

## Handlers

Handlers in our case are functions meant to map incoming bot messages to perform a specific task. I want you to take a look at this code snippet. Don't try to think any kind of optimizations yet. Just give it a look and and understand how it works.

```go
// handler.go
func Handler(m *message) {
	data := &botData{}

	switch case m.Text {
	case "user":
		User(data)
	// case
	default:
		// return help document
	}
}

func User(b *botData) error {
	switch case b.payload {
	case "add":
			// adding user to a storage
			err := addUser(b)
			// error handling here
			if err != nil {
					reply("can't add a user")
					return err
			}
			reply("success adding a user")
			return nil
	case "remove":
			// removing user from a storage
			// error handling here
	case "list":
			// listing user
			// error handling here
	case "help":
			// show command's help
			// error handling here
	default:
			// show command's help
	}
}
```

Ok so here's the problem with this implementation. The hardest part about writing a bot application is that we don't have something like http routes. We don't have a kind of kubernetes ingress controller that will gently direct incoming host path urls to a particular service. No body tells you an incoming bot message is belong to which function.

So, we ended up writing switch case statements as this was pretty straight forward and fairly easy to implement.

But then we needed to add new commands, we had to write another crazy switch case function. This is an example of what happens if there's somebody text a message "user" to the bot and how it should be responded.

```go
command
 -> user -> returns help
 -> user help -> returns a help description for user commands
 -> user add @user -> add a user
 -> user remove @user -> remove a user
 -> user list -> give a list of avaialable users
```

We found a workaround that allows us to ditch the nested handler. We wrote list of regex patterns associated with handler functions. If an incoming message is match with a regex pattern, the associated function will be executed.

```go
commands := map[string]*Command{
	`user`: handler.UserHelp,
	`user add `:  handler.UserAdd,
	`user remove `:  handler.UserRemove,
	`user list( [\w]+)?`:  handler.UserList,
}
```

This is huge. Now handler functions are absent from the routing business.

But we're not done yet. This code became difficult to read when we added a sort of role based authentication route. So, there were only specific users that can access particular commands.

```go
func User(b *botData) error {
	if isAuthenticated(b.Username) {
		switch b.payload {
			// handles cases
		}
	}
}
```

We knew this was problematic. Having another switch case or if-else statements for new commands is insane and yet our handler functions were still handling few business logics. With this concern in mind, we started adopting one of the coolest techniques in go, it's called ⤵️

## Middleware

Ok, so what is middleware?

The idea is how to run certain things on top of a function.

It's like working with photoshop layers where you're not directly putting your effects on a single canvas, but you'll have multiple canvas stacked on top of one another instead. All layers are focused on doing their one particular job.

But just be aware that sometimes your middleware can behave like distortion pedals. You can put dozens of effects on your guitar, you can have them as many as you want, you can have so much fun with composing different types of effects, but then your music would taste like a curry with a matcha latte whipped cream on top of it.

That's middleware in a nutshell. We want to encapsulate and compose few couples of functionalities such as user based authentication commands, logging, sending metrics to a monitoring dashboard, and etc on top of a handler function. We want them to act together but we don't want mixed them together in one place.

You might ask, why do you want them to work that way?

Putting several business logics in one function is not fun. I think it's safe to say that functions should deal with one problem only. Your functions will be a lot more concise, small, readable, organized, predictable, and reusable. It's good for everybody.

What if you don't? all functions will look like a mac os yosimite desktop. Screenshots, documents, and other files will be laid out on your screen like a messy dorm room.

Let's start with how to make middleware work together. This next code snippet is the foundation of composing set of middleware on top of a function.

```go
type BotHandler func(b *BotData) error {}
type Middleware func(BotHandler) BotHandler {}

func Apply(bh BotHandler, md ...Middleware) BotHandler {
	maxIdx := len(md) - 1
	for i := range md {
		bh = md[maxIdx-i](bh)
	}

	return bh
}
```

At first this code seemed baffling to me. My confusion was how the handler function is going to be executed and also how could this function be valid. It's supposed to return a `BotHandler` type function, but it seemed like we would have an array of functions. But that's not true, the Apply function would return a chain of `BotHandler` type functions.

Here's how it works. Let's say we want to wrap handle with 4 middleware.

```go
Apply accepts decorators and wraps them in a chained functions

apply(handle, mdw1, mdw2, mdw3, mdw4)

i=0 handle = mdw4(handle)
i=1 handle = mdw3(mdw4(handle))
i=2 handle = mdw2(mdw3(mdw4(handle)))
i=3 handle = mdw1(mdw2(mdw3(mdw4(handle))))
```

Try to think of it as if you're having a nested folder structure. But all folders should have one folder (except the last folder) and all folders have to have an image.

```go
a
├── b
│   ├── c
│   │   ├── d
│   │   │   └── img-d.jpg
│   │   └── img-c.jpg
│   └── img-b.jpg
└── img-a.jpg
```

Now let's try to do it with our functions, this illustration literally portrays the middleware execution.

```go
mdw1
├── mdw2
│   ├── mdw3
│   │   ├── mdw4
│   │   │   ├── handle
│   │   │   │   └── error
│   │   │   └── error
│   │   └── error
│   └── error
└── error
```

If `mdw2` returns an error the next middleware and the handle function won't be executed. but `mdw1` will track all next middleware and handle function error values. `mdw2` doesn't track `mdw1` error return but it will track its next middleware and handle error returns, and so on.

Explicitly writing down a function execution helps a lot in figuring out how it works. If it takes you for more than 10 minutes to know how a certain logic works, write it down. I promise you, it's really helpful. That's a mantra I say to myself when I'm writing code.

This is great because functions can run independently in sequence. Here's one of our middleware looks like.

```go
func Auth() Middleware {
	return func(handle BotHandler) BotHandler {
		return func(d *BotData) error {
			// fecth user list from a database
			// return error if there's an error

			// check if userid is exis in the user list
			// return error if there's an error
			// if it's exist, return nil

			// everyting seems ok, pass it the next function
			return handle(d)
		}
	}
}

func Log() Middleware {
	return func(handle BotHandler) BotHandler {
		return func(d *BotData) error {
			// logging implementation ....
			return handle(d)
		}
	}
}

func Monitor() Middleware {
	return func(handle BotHandler) BotHandler {
		return func(d *BotData) error {
			// sending metrics to a server ...
			return handle(d)
		}
	}
}

// Here's how to use it.
handlerFunc := middleware.Apply(handler.UserAdd, Log, Auth, Monitor)
err := handlerFunc()
```

But more interestingly, a middleware can have access to the previous middleware execution result. And if you store a context, you can pass any data, you can use it as a state for the next middleware, you can have stateful middleware. Here's how it's done.

```go
type BotData interface {
	Ctx context.Context
	// properties
}

type MergeDetail struct {
	// ID, author, detail etc
}

const (
	MERGE_DETAIL_CTX string = "MERGE_DETAIL"
)

func ValidateMR() Middleware {
	return func(handle BotHandler) BotHandler {
		return func(d *BotData) error {
			md, error := repo.GetMergeRequestDetail(d.Payload)

			// save to context
			d.Ctx = context.WithValue(d.Ctx, MERGE_DETAIL_CTX, md)

			// validate MR

			// everyting seems ok, pass it the next function
			return handle(d)
		}
	}
}

func OnlyAllowMaintainer() Middleware {
	return func(handle BotHandler) BotHandler {
		return func(d *BotData) error {
			// Reuse Merge Detail data from ValidateMR middleware
			md := d.Ctx.Value(MERGE_DETAIL_CTX).(MergeDetail)

			// Validate

			return nil
		}
	}
}

handlerFunc := middleware.Apply(handler.MergeMR, Log, ValidateMR, OnlyAllowMaintainer)
err := handlerFunc()
```

One of the benefits of having the approach above is we can reuse data obtained by previous middleware. This reduces the amount of http call to get data from a server. Though, this approach looks a bit fragile because the `OnlyAllowMaintainer` middleware acutely depends on the `ValidateMR` middleware. We have to be very cautious with our test.

## Test

Ok, let's talk about test. I know tests are hard and tedious. But testing is really the best way to get our thought closer to a reliable judgement. You know when we're writing code, we are basically articulating our assumptions to address a specific problem with a solution. And sometimes our solution only embraces a few number of cases. When we play a devil advocate to it or when it's questioned with a such jarring test case scenario, our predisposed sort of chesty assumption often breaks which goes to say that our code is now vulnerable and prone to bugs.

But in practice, you will likely to bargain with the velocity of delivery. With this concern in mind, a certain trade off has to make in how far are you going to tolerate to emerging runtime errors or bugs by those untested circumstances.

So, previously our test looked like this.

```go
type Database interface {}

// test file
type MockDB struct {
	// state
}

func NewMockDB() Database {
	return &MockDB{}
}

func (mr *MockDB) GetUser ([]User, error){
	return []User{}
}

func TestGetUser(t *testing.T) {
	db := NewMockDB()
	user, error := db.GetUser()

	// test cases...
}
```

When the first time I saw this, I was perplexed. I talked to myself, how our functions are going to be tested if the implementation is rewritten in the test file. What if we add more functions? we have to write more implementations in our test file. And our test file was so big.

Our mock functions were completely "disconnected" from the functions. That says, our test didn't directly call the legitimate interface instances. We reimplemented interfaces functions in our test files and sometimes we bended them in order to make them fit to our test scenarios. This is dangerous because tests didn't comprehensively assert the concrete implementation.

We wrapped our head around this issue. We decided to reorganize our interfaces. We introduced hierarchical structures to our packages which organizes interfaces and functions in several sub-packages. We split packages to nested packages. We extracted functions that address domains of logics to many mini files, so there are like 5 to 7 files with 50 to 300 lines of code in one package and sub-packages.

This makes our tests tidily disseminated near their functions. The amount of test code lines drop drastically in an significant number despite the increasing amount of test coverages.

However, we were still a bit worried with our integration test. This code structure change imposed a challenge to us on how to test the main functions which integrate functionalities from lots of different packages.

We were so lucky at that moment. We found an amazing testing tool, [Mockery](https://github.com/vektra/mockery). Mockery is a badass testing kit that takes care of the testing boring stuff, writing mock functions.

This is mockery in action.

```go
package database

//go:generate mockery --name Provider --case=underscore --output databasetest --outpkg databasetest

type Provider interface {
	GetUser(User[], error)
	...
}
```

Running "go generate" in your terminal will produce mock functions that look like this

```go
package databasetest

// Provider is an autogenerated mock type for the Provider type
type Provider struct {
	mock.Mock
}

func (_m *Provider) GetUser() ([]User, error) {
	var r0 []User
	var r1 error
	...
	return r0, r1
}

...
```

Now we have our interfaces implementations handled by Mockery. You can impersonate any inputs and outputs of your interfaces without touching the implementation. This is one example of it.

```go
mockProvider := &databasetest.Provider{}
mockProvider.On("GetUser").Return([]User{}, errors.new("can't fetch user"))

// call functions
// assert results
```

Our integration tests heavily utilize mockery at the top level. Mockery gives us an ultimate freedom to loosely mock interface implementations. And the good thing is this allows us to write interface implementation independently. We also can write tests from any directions with the given interfaces. We can write tests for interface implementation functions and we can test functions that employ interfaces separately. It's hugely beneficial if you're working on a team.

Mockery mocks interfaces' inputs and outputs without manipulating the implementation. This is rejuvenating my motivation in writing more tests. Mockery dramatically improves our testing experience.

## Logging

This is like one of the underpinning features of providing application reliability. Log is one the most powerful tool when it comes to trace application root issues. I often find logs spoil me an actor who creates chaos. Log is like a friend who likes to tell you what's gonna happen in a movie.

One of the issues we had was that our app logged lots of things down in the console. This was formerly used as a debugger to track which part of the code is running when a particular task is executed.

This is fine actually and we didn't have any problems of having super verbose logs in our app. But we found that we didn't actually look at them. We only paid our attention to what's coming in and out, and errors when there's an issue raised in our application.

We found [pkg errors](https://github.com/pkg/errors) solves our need in tracing application issues. Pkg error elegantly wraps errors produced by nested function calls in a stack pile.

And this influenced a really good practice in rewriting our application. We have a mental model that stipulates our functions to include an error return in any scenarios whenever it's possible.

But in the real world, you'll find use cases where a function doesn't incorporate a return. One example we found in our case was having a go routine function to let the bot to reactively listen to incoming messages.

We made a decision to ditch our previous verbose log and use pkg as the replacement. This how we integrated pkg into our log middleware.

```go
import (
	...
	"github.com/pkg/errors"
	..
)
type tracer interface {
	StackTrace() errors.StackTrace
}

// StackTrace get stacktrace from error
func StackTrace(errLog error) string {
	if err, ok := errLog.(tracer); ok {
		var traces string

		for _, f := range err.StackTrace() {
			traces += fmt.Sprintf("%+v\n", f)
		}

		return traces
	}

	return ""
}

// Logging Middleware
func Log(logger *zap.Logger) Middleware {
	return func(handle BotHandler) BotHandler {
		return func(d *BotData) error {
			...
			err := handle(d)
			var zapFields []zapcore.Field
			zapFields = append(zapFields,
					...
					zap.String("stacktrace", StackTrace(err)),
					zap.String("severity", "ERROR"),
				)
			logger.Error(err.Error(), zapFields...)
			...
			return err
		}
	}
}
```

We use [Uber zap](https://github.com/uber-go/zap) as our logger anyway. And this is the error stack in action.

```json
// Log
{
  "level": "error",
  "stacktrace": "github.com/bot/v2/bot/handler.itaMerging\n\t/builds/bot/handler/background.go:107\ngithub.com/bot/v2/bot/handler.IdleToActive\n\t/builds/bot/handler/background.go:80\ngithub.com/bot/v2/bot/slack.(*Bot).Background.func1\n\t/builds/bot/slack/slack.go:240\ngithub.com/bot/v2/bot/slack.(*Bot).Background\n\t/builds/bot/slack/slack.go:245\nruntime.goexit\n\t/usr/local/go/src/runtime/asm_amd64.s:1357\n",
  "severity": "ERROR",
  "status": "fail"
}

// stacktrace
github.com/bot/v2/bot/handler.itaMerging
	/builds/bot/handler/background.go:107
github.com/bot/v2/bot/handler.IdleToActive
	/builds/bot/handler/background.go:80
github.com/bot/v2/bot/slack.(*Bot).Background.func1
	/builds/bot/slack/slack.go:240
github.com/bot/v2/bot/slack.(*Bot).Background
	/builds/bot/slack/slack.go:245
runtime.goexit
	/usr/local/go/src/runtime/asm_amd64.s:1357
```

This is like a birthday cake thrown to a face at a debugging party. We now know exactly which parts of the code get involved in the crime scene.

# Epilogue

Rewriting is a truly dissenting topic. It's resource consuming, you're likely to delay new feature developments, and the business values offered by this approach are obscure sometimes.

I think rewriting applications, services, or scripts is more about improving development experience and maintainability. If rewriting or refactoring could speed up tasks execution time or gain efficient resource usages, that'd be a bonus. I know, there are cases out there that aim refactoring or rewriting for these concerns but in our case, maintenance was the UFC championship weight class we put our bet on.

I'm not lying to you and this is true. At the time I wrote this, our bot ran into an issue. We used to take hours for scouring a tremendous amount of logs in order to know what's happening within the app and finding out the issue and then we reproduced the case. But yesterday we only needed less than 10 minutes from discovering the root cause of the issue to writing the details of what it needs to do in our backlog.

We're ready for the upcoming bugs and errors. It seems like we're setting up a crash for our app, but I think we would never be able to eradicate errors. I would finish my writing here. I don't want this pod get injected with another sidecar container. I mean we've talked about a lot of things. I hope you find them insightful and joyful.

Thanks for reading.
